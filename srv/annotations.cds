using PurchaseService from './services';

annotate PurchaseService.PurchaseRequests with {
  ID          @UI.Hidden;
  title       @title: 'Title';
  requester   @title: 'Requester';
  status      @title: 'Status';
  totalAmount @title: 'Total Amount' @Measures.ISOCurrency: currency_code;
  currency    @title: 'Currency' @Common.Text: currency.name;
  urgent      @title: 'Urgent';
  comment     @title: 'Comment';
  category    @title: 'Category' @Common.Text: category.name @Common.TextArrangement: #TextOnly;
  supplier    @title: 'Supplier' @Common.Text: supplier.name @Common.TextArrangement: #TextOnly;
  createdAt   @title: 'Created';
};

annotate PurchaseService.PurchaseRequests with @(
  Common.SemanticKey: [title],
  UI: {
    HeaderInfo: {
      TypeName       : 'Purchase Request',
      TypeNamePlural : 'Purchase Requests',
      Title          : { Value: title },
      Description    : { Value: supplier.name }
    },
    SelectionFields: [ status, category_ID, supplier_ID, urgent ],
    LineItem: [
      { Value: title },
      { Value: requester },
      { Value: category_ID },
      { Value: supplier_ID },
      { Value: totalAmount },
      { Value: status, Criticality: statusCriticality },
      { Value: urgent },
      { $Type: 'UI.DataFieldForAction', Action: 'PurchaseService.approve', Label: 'Approve' },
      { $Type: 'UI.DataFieldForAction', Action: 'PurchaseService.rejectRequest',  Label: 'Reject' }
    ],
    Identification: [
      { $Type: 'UI.DataFieldForAction', Action: 'PurchaseService.approve', Label: 'Approve' },
      { $Type: 'UI.DataFieldForAction', Action: 'PurchaseService.rejectRequest',  Label: 'Reject' }
    ],
    HeaderFacets: [
      { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Total' },
      { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Status' }
    ],
    DataPoint #Total:  { Value: totalAmount, Title: 'Total Amount' },
    DataPoint #Status: { Value: status, Title: 'Status', Criticality: statusCriticality },
    Facets: [
      { $Type: 'UI.ReferenceFacet', ID: 'General', Label: 'General Information', Target: '@UI.FieldGroup#General' },
      { $Type: 'UI.ReferenceFacet', ID: 'Items',   Label: 'Items', Target: 'items/@UI.LineItem' }
    ],
    FieldGroup #General: {
      Data: [
        { Value: title },
        { Value: requester },
        { Value: category_ID },
        { Value: supplier_ID },
        { Value: currency_code },
        { Value: urgent },
        { Value: comment },
        { Value: status }
      ]
    }
  }
);

annotate PurchaseService.PurchaseRequests with {
  category @Common.ValueList: {
    CollectionPath: 'Categories',
    Parameters: [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: category_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
    ]
  };
  supplier @Common.ValueList: {
    CollectionPath: 'Suppliers',
    Parameters: [
      { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: supplier_ID, ValueListProperty: 'ID' },
      { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
    ]
  };
};

annotate PurchaseService.RequestItems with {
  ID          @UI.Hidden;
  request     @UI.Hidden;
  description @title: 'Description';
  quantity    @title: 'Quantity';
  unitPrice   @title: 'Unit Price';
  lineTotal   @title: 'Line Total';
};

annotate PurchaseService.RequestItems with @(
  UI: {
    HeaderInfo: { TypeName: 'Item', TypeNamePlural: 'Items', Title: { Value: description } },
    LineItem: [
      { Value: description },
      { Value: quantity },
      { Value: unitPrice },
      { Value: lineTotal }
    ],
    Facets: [
      { $Type: 'UI.ReferenceFacet', ID: 'ItemDetails', Label: 'Item', Target: '@UI.FieldGroup#Item' }
    ],
    FieldGroup #Item: {
      Data: [ { Value: description }, { Value: quantity }, { Value: unitPrice }, { Value: lineTotal } ]
    }
  }
);

annotate PurchaseService.Categories with {
  ID   @UI.Hidden;
  name @title: 'Category';
};

annotate PurchaseService.Suppliers with {
  ID   @UI.Hidden;
  name @title: 'Supplier';
};

annotate PurchaseService.PurchaseRequests with actions {
  rejectRequest(reason @(title: 'Rejection reason', mandatory));
};
