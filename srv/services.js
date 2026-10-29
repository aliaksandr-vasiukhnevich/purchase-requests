import cds from '@sap/cds';

const FINAL_STATUSES = ['APPROVED', 'REJECTED'];
const APPROVER_THRESHOLD = 5000;

const sumItems = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0), 0);

export class PurchaseService extends cds.ApplicationService {
  init() {
    const { PurchaseRequests } = this.entities;

    // Business rule 1: derived totals + default status on create.
    this.before('CREATE', PurchaseRequests, (req) => {
      const { data } = req;
      data.status = 'NEW';
      data.requester ??= req.user.id;
      for (const item of data.items ?? []) {
        item.lineTotal = Number(item.quantity) * Number(item.unitPrice);
      }
      data.totalAmount = sumItems(data.items);
    });

    // Business rule 2: records in a final status are frozen.
    this.before(['UPDATE', 'DELETE', 'EDIT'], PurchaseRequests, async (req) => {
      const ID = req.data.ID ?? req.params[0]?.ID;
      const current = await SELECT.one.from(PurchaseRequests, ID).columns('status');
      if (current && FINAL_STATUSES.includes(current.status)) {
        req.reject(409, `Request is already ${current.status} and cannot be changed`);
      }
    });

    this.before('UPDATE', PurchaseRequests, (req) => {
      const { data } = req;
      if (!data.items) return;
      for (const item of data.items) {
        item.lineTotal = Number(item.quantity) * Number(item.unitPrice);
      }
      data.totalAmount = sumItems(data.items);
    });

    // Business rule 3: approval amount gate, mirrors the BPA process from homework 1.
    this.on('approve', PurchaseRequests, async (req) => {
      const { ID } = req.params[0];
      const request = await SELECT.one.from(PurchaseRequests, ID).columns('status', 'totalAmount');
      if (!request) return req.reject(404, 'Request not found');
      if (request.status !== 'NEW') return req.reject(409, `Request is already ${request.status}`);
      if (request.totalAmount > APPROVER_THRESHOLD && !req.user.is('finance')) {
        return req.reject(403, `Requests above ${APPROVER_THRESHOLD} require the finance role`);
      }
      await UPDATE(PurchaseRequests, ID).with({ status: 'APPROVED' });
    });

    this.on('rejectRequest', PurchaseRequests, async (req) => {
      const { ID } = req.params[0];
      const { reason } = req.data;
      if (!reason) return req.reject(400, 'A rejection reason is required');
      const request = await SELECT.one.from(PurchaseRequests, ID).columns('status');
      if (!request) return req.reject(404, 'Request not found');
      if (request.status !== 'NEW') return req.reject(409, `Request is already ${request.status}`);
      await UPDATE(PurchaseRequests, ID).with({ status: 'REJECTED', comment: reason });
    });

    // Enrich READ with Fiori criticality (1 = red, 2 = yellow, 3 = green).
    this.after('READ', PurchaseRequests, (rows) => {
      for (const row of Array.isArray(rows) ? rows : [rows]) {
        if (!row) continue;
        row.statusCriticality = { NEW: 2, APPROVED: 3, REJECTED: 1 }[row.status] ?? 0;
      }
    });

    return super.init();
  }
}
