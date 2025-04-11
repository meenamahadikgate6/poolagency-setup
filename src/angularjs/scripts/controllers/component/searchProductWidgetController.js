angular.module('POOLAGENCY')
.controller('searchProductWidgetController', function($rootScope, $scope, apiGateWay, $timeout, $filter, $stateParams, $state, auth, ngDialog, configConstant, pendingRequests, $q) { 
    $scope.loggedInuserPS = auth.getSession();
    $scope.widgetArea = ''; 
    $scope.lineitems = [];     
    $scope.roleId = 0; 
    $scope.techType = '';   
    $scope.areaNames = [
        "invoiceDetail", // Invoice Details Page
        "quotesDetail", // Quote Details Page
        "equipmentSection", // Equipment Popup
        "chemicalMapping", // Chemical Mapping
        "quoteTemplate", // Quote template 
        "jobTemplate", // Job template
        "oneTimeJob", // Onetime Job
        "productServicePage", // product Service Page 
        "invoiceList", // Invoice list Page 
        "techPayJob", // Tech pay job on setting page
        "techPaySale", // Tech pay sale on setting page
        "inventory", // inventory
    ]    
    $scope.selectProductSearchWidgetArea = function(area='', lineitems=[], roleId=0, techType='') {
        $scope.widgetArea = area; 
        $scope.lineitems = lineitems;    
        $scope.roleId = roleId;
        $scope.techType = techType;
    }  
    $scope.focusInput = function() {
        let input = document.querySelectorAll('.product-search-widget-input')
        if (input) {
            input[0].focus();
        }
    }
    $scope.spwPayLoad = {
        offset: 0,
        limit: 5,
        sortOrder: 'asc',
        sortColumn: 'name',
        category: 'Product-Service-Bundle',
        status: 1,
        name: '',
        rows: 0,
        hasMoreData: false
    }
    $scope.getFormattedPayLoad = () => {
        let payload = angular.copy($scope.spwPayLoad)
        if ($scope.widgetArea == 'productServicePage') {
            payload.category = 'Product-Service';
        }
        if ($scope.widgetArea == 'chemicalMapping' || $scope.widgetArea == 'inventory') {
            payload.category = 'Product';
        }
        if ($scope.widgetArea == 'techPayJob' || $scope.widgetArea == 'techPaySale') {
            payload.category = 'Product-Service';
            payload.roleId = $scope.roleId;
            payload.techType = $scope.techType;
        }
        delete payload.rows
        delete payload.hasMoreData
        return payload;
    }
    $scope.spwProductData = [];    
    $scope.isSPWProductPopupSearching = true;
    $scope.SPWSearchProductIntervalGap = 0; 
    $scope.SPWLoadMoreProductData = () => { 
        $scope.isSPWProductPopupSearching = true;
        $scope.SPWSearchProductIntervalGap = 0;       
        clearInterval($scope.SPWSearchInterval);
        $scope.spwPayLoad.offset = $scope.spwPayLoad.offset + 1;
        $scope.SPWShowListForBundle($scope.spwPayLoad.name ? $scope.spwPayLoad.name : '', true)
    }
    $scope.SPWShowListForBundle = (searchText, offsetModified=false) => {
        // multiple request
        let endpoint = "/product_services";
        if ($scope.widgetArea == 'inventory') {
            endpoint = "/inventory/inventory_items";
        }
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {                    
                    r.canceller.resolve()
                    return
                }
            })
        } 
        // multiple request
        if (!offsetModified) {
            $scope.SPWSearchProductIntervalGap = 500;
            $scope.spwPayLoad.offset = 0;
            $scope.spwPayLoad.rows = 0;
            $scope.spwPayLoad.hasMoreData = false;
            $scope.spwProductData = [];
        }
        $scope.spwPayLoad.name = searchText;
        $scope.searchText = searchText;
        $scope.bundleSearchText = searchText;        
        $scope.isSPWProductPopupSearching = true;
        clearInterval($scope.SPWSearchInterval);       
        $scope.SPWSearchInterval = setTimeout(function() {   
            if(searchText.length>0){
                apiGateWay.get(endpoint, $scope.getFormattedPayLoad()).then(function(response) {
                    if (response.data.status == 200) {
                        $scope.spwPayLoad.rows = response.data.data.rows;                        
                        $scope.spwPayLoad.hasMoreData = (($scope.spwPayLoad.offset + 1) * $scope.spwPayLoad.limit) < response.data.data.rows;                        
                        let bundleSearchList = response.data.data.data;                        
                        let newProducts = [];                        
                        angular.forEach(bundleSearchList, (elementProduct) => {  
                            if ($scope.widgetArea != 'invoiceDetail') {
                                if ($scope.widgetArea == 'quoteTemplate' || $scope.widgetArea == 'quotesDetail') {
                                    if($scope.lineitems.findIndex(item => item.title === elementProduct.name) === -1) {                                    
                                        newProducts.push(elementProduct);
                                    } 
                                } else {
                                    if($scope.lineitems.findIndex(item => item.name === elementProduct.name) === -1) {                                    
                                        newProducts.push(elementProduct);
                                    }  
                                }                                                       
                            } else {
                                newProducts.push(elementProduct);                                
                            }                            
                        });                         
                        bundleSearchList = newProducts;                       
                        angular.forEach(bundleSearchList, (elementProduct) => {  
                            $scope.spwProductData.push(elementProduct)                            
                        }); 
                    }                    
                    $scope.isSPWProductPopupSearching = false;
                    setTimeout(() => {
                        var objDiv = document.getElementsByClassName("ps-picker")[0];
                        if (objDiv) {
                            objDiv.scrollTop = objDiv.scrollHeight;
                        }
                    }, 100)
                });
            }
        }, $scope.SPWSearchProductIntervalGap);        
    }
    $scope.currencyTrimmer = function(c) {
        var finalValue = c;
        if (c) {
            c = Number(c);
            finalValue = Number(Math.round(finalValue * 1000) / 1000)
            finalValue = Number(Math.round(finalValue * 100) / 100)
        }
        return finalValue;
    }
    $scope.addProductToBundle = function(data) {
        data.widgetArea = $scope.widgetArea;
        $scope.$emit('productAddEvent', data);
    }  
    $scope.$on('$destroy', function() {
        $scope.widgetArea = ''; 
        $scope.lineitems = [];         
    });
    $scope.hideProdctWidget = function() {
        let data = {};
        data.widgetArea = $scope.widgetArea;
        data.isClose = true;
        $scope.$emit('productAddEvent', data);
        let input = document.querySelectorAll('.product-search-widget-input')[0];
        if (input) {
            input.value = '';
            $scope.isSPWProductPopupSearching = true;
            $scope.spwProductData = [];
            $scope.bundleSearchText = '';
            $scope.selectProductSearchWidgetArea('inventory');
        }
    }
    $timeout(function(){
        let input = document.querySelectorAll('.product-search-widget-input')[0]
        if (input) {
            input.focus();
        }
    }, 100)
    $scope.smallWidgetAreas = ['jobTemplate','quoteTemplate']
    $rootScope.refreshProductSearch = (productName) => {
        $scope.SPWShowListForBundle(productName)
    }
})