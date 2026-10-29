sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"leverx/purchaserequests/test/integration/pages/PurchaseRequestsList.gen",
	"leverx/purchaserequests/test/integration/pages/PurchaseRequestsObjectPage.gen",
	"leverx/purchaserequests/test/integration/pages/RequestItemsObjectPage.gen"
], function (JourneyRunner, PurchaseRequestsListGenerated, PurchaseRequestsObjectPageGenerated, RequestItemsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('leverx/purchaserequests') + '/test/flp.html#app-preview',
        pages: {
			onThePurchaseRequestsListGenerated: PurchaseRequestsListGenerated,
			onThePurchaseRequestsObjectPageGenerated: PurchaseRequestsObjectPageGenerated,
			onTheRequestItemsObjectPageGenerated: RequestItemsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

