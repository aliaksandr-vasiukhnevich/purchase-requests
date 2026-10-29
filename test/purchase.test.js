import cds from '@sap/cds';

const { GET, POST, expect } = cds.test(new URL('..', import.meta.url).pathname);
const BASE = '/purchase/PurchaseRequests';
const NEW_REQUEST = {
  title: 'Test keyboards',
  currency_code: 'USD',
  category_ID: '11111111-0000-0000-0000-000000000001',
  supplier_ID: '22222222-0000-0000-0000-000000000001',
  items: [
    { description: 'Keychron K2', quantity: 3, unitPrice: 90 },
    { description: 'Wrist rest', quantity: 3, unitPrice: 10 }
  ]
};
const asAlice = { auth: { username: 'alice' } };
const asBob = { auth: { username: 'bob' } };
const asCarol = { auth: { username: 'carol' } };
const asDave = { auth: { username: 'dave' } };

describe('PurchaseService', () => {
  it('lists seeded purchase requests', async () => {
    const { data } = await GET(`${BASE}?$filter=IsActiveEntity eq true`, asAlice);
    expect(data.value).to.have.length(5);
  });

  it('reads a single request with its items', async () => {
    const { data } = await GET(
      `${BASE}(ID=33333333-0000-0000-0000-000000000001,IsActiveEntity=true)?$expand=items`,
      asAlice
    );
    expect(data.title).to.equal('Laptops for new hires');
    expect(Number(data.totalAmount)).to.equal(6400);
    expect(data.items).to.have.length(1);
  });

  it('custom handler calculates totals and defaults status on draft activation', async () => {
    const { items, ...header } = NEW_REQUEST;
    const { data: draft } = await POST(BASE, header, asAlice);
    const draftKey = `${BASE}(ID=${draft.ID},IsActiveEntity=false)`;
    for (const item of items) await POST(`${draftKey}/items`, item, asAlice);

    const { data } = await POST(`${draftKey}/PurchaseService.draftActivate`, {}, asAlice);
    expect(data.status).to.equal('NEW');
    expect(Number(data.totalAmount)).to.equal(300);
    expect(data.requester).to.equal('alice');

    const { data: saved } = await GET(`${BASE}(ID=${draft.ID},IsActiveEntity=true)?$expand=items`, asAlice);
    expect(saved.items.map((item) => Number(item.lineTotal))).to.deep.equal([270, 30]);
  });

  it('approved request cannot be edited', async () => {
    await expect(
      POST(`${BASE}(ID=33333333-0000-0000-0000-000000000003,IsActiveEntity=true)/PurchaseService.draftEdit`, {}, asAlice)
    ).to.be.rejectedWith(/already APPROVED/);
  });

  it('rejects a request that is already in a final status', async () => {
    await expect(
      POST(`${BASE}(ID=33333333-0000-0000-0000-000000000003,IsActiveEntity=true)/PurchaseService.approve`, {}, asBob)
    ).to.be.rejectedWith(/already APPROVED/);
  });

  it('approver without finance role cannot approve above the threshold', async () => {
    await expect(
      POST(`${BASE}(ID=33333333-0000-0000-0000-000000000001,IsActiveEntity=true)/PurchaseService.approve`, {}, asBob)
    ).to.be.rejectedWith(/403/);
  });

  it('finance approver can approve above the threshold', async () => {
    await POST(`${BASE}(ID=33333333-0000-0000-0000-000000000001,IsActiveEntity=true)/PurchaseService.approve`, {}, asCarol);
    const { data } = await GET(`${BASE}(ID=33333333-0000-0000-0000-000000000001,IsActiveEntity=true)`, asAlice);
    expect(data.status).to.equal('APPROVED');
  });

  it('approver can reject with a reason, reason is stored as comment', async () => {
    const key = `${BASE}(ID=33333333-0000-0000-0000-000000000005,IsActiveEntity=true)`;
    await POST(`${key}/PurchaseService.rejectRequest`, { reason: 'Travel freeze' }, asBob);
    const { data } = await GET(key, asAlice);
    expect(data.status).to.equal('REJECTED');
    expect(data.comment).to.equal('Travel freeze');
  });

  it('reject without a reason is a 400', async () => {
    await expect(
      POST(`${BASE}(ID=33333333-0000-0000-0000-000000000002,IsActiveEntity=true)/PurchaseService.rejectRequest`, {}, asBob)
    ).to.be.rejectedWith(/400/);
  });

  it('requester role cannot approve', async () => {
    await expect(
      POST(`${BASE}(ID=33333333-0000-0000-0000-000000000002,IsActiveEntity=true)/PurchaseService.approve`, {}, asAlice)
    ).to.be.rejectedWith(/403/);
  });

  it('user without requester role cannot create', async () => {
    await expect(POST(BASE, NEW_REQUEST, asDave)).to.be.rejectedWith(/403/);
  });
});
