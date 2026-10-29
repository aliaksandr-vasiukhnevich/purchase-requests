using { leverx.pr as db } from '../db/schema';

@path: '/purchase'
@requires: 'authenticated-user'
service PurchaseService {

  @odata.draft.enabled
  @restrict: [
    { grant: 'READ',   to: 'authenticated-user' },
    { grant: 'WRITE',  to: 'requester' },
    { grant: ['approve', 'rejectRequest'], to: 'approver' },
    { grant: 'approve', to: 'finance' }
  ]
  entity PurchaseRequests as projection on db.PurchaseRequests actions {
    action approve();
    action rejectRequest(reason : String(500));
  };

  entity RequestItems as projection on db.RequestItems;

  @readonly
  entity Categories as projection on db.Categories;

  @readonly
  entity Suppliers as projection on db.Suppliers;
}
