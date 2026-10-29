using { cuid, managed, Currency } from '@sap/cds/common';

namespace leverx.pr;

type Status : String(10) enum {
  NEW      = 'NEW';
  APPROVED = 'APPROVED';
  REJECTED = 'REJECTED';
}

entity Categories : cuid, managed {
  name        : String(60) @mandatory;
  description : String(255);
  requests    : Association to many PurchaseRequests on requests.category = $self;
}

entity Suppliers : cuid, managed {
  name     : String(100) @mandatory;
  email    : String(100);
  country  : String(2);
  requests : Association to many PurchaseRequests on requests.supplier = $self;
}

entity PurchaseRequests : cuid, managed {
  title       : String(120) @mandatory;
  requester   : String(100);
  status      : Status default 'NEW' @Common.FieldControl: #ReadOnly;
  totalAmount : Decimal(15, 2) @Common.FieldControl: #ReadOnly;
  currency    : Currency;
  urgent      : Boolean default false;
  comment     : String(500);
  category    : Association to Categories @mandatory;
  supplier    : Association to Suppliers @mandatory;
  items       : Composition of many RequestItems on items.request = $self;
  virtual statusCriticality : Integer;
}

entity RequestItems : cuid {
  request     : Association to PurchaseRequests;
  description : String(120) @mandatory;
  quantity    : Integer @mandatory @assert.range: [1, 10000];
  unitPrice   : Decimal(15, 2) @mandatory @assert.range: [0.01, 1000000];
  lineTotal   : Decimal(15, 2) @Common.FieldControl: #ReadOnly;
}
