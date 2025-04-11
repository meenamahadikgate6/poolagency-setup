angular.module('POOLAGENCY')

.controller('billingSettingController', function($rootScope, $scope, apiGateWay, ngDialog, auth, $timeout) {  
  $scope.companyId = auth.getSession().userType == "administrator" ? auth.getSession().selectedCompany : (auth.getSession().companyId ?  auth.getSession().companyId : '');
  $scope.billingActive = true; //default should be false  
  $scope.modelBillingSettingObj = {
    "discountData": [],
    "taxData": [],
    "taxDefaultNone": true,
    "activateBilling": true, 
    "companyId":  $scope.companyId, 
    "customersPay": "Monthly Flat Rate", 
    "invoiceNotes": "We appreciate your business and prompt payment", 
    "invoicedOn": "First of Month", 
    "isAutoCharge": true, 
    "isAutoEmailInvoice": true, 
    "isReattemptCharge": true,  
    "reattemptDays": 14, 
    "terms": "Due in 30 days",
    "serviceLevel": [],
    "lastInvoiceNumber":0,
    "invoiceStartFrom":100,
    "taxOnProduct": 0,
    "taxOnService": 0,
    "isServiceDatesHidden": false,
  };
  $scope.billingSettingObj = angular.copy($scope.modelBillingSettingObj)
  $scope.selectedCustomerPayServiceLevelIndex = 0;
  $scope.successMsg = '';
  $scope.errorMsg = '';
  $scope.initialSLoad = true;
  $scope.initialDLoad = true;
  $scope.taxSelectedIndex = null;
  $scope.discountError = []
  $rootScope.taxSettingsForSettingPage = {};
  //get Billing Setting
  $rootScope.getCompanyBillingSettings = function(){
    
    $scope.selectedCustomerPayServiceLevelIndex = 0;
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    apiGateWay.get("/company_billing_settings").then(function(response) {
        if (response.data.status == 200) {
          if(response.data.data){ 
            if (response.data.data.taxData && response.data.data.taxData.length > 0) {
              angular.forEach(response.data.data.taxData, function(item){
                item.amount = Number(item.amount)
              });
             }  
            $scope.modelBillingSettingObj = angular.copy(response.data.data);
            $rootScope.activateBilling = angular.copy(response.data.data.activateBilling);
            $scope.billingSettingObj = angular.copy(response.data.data);
            $rootScope.taxSettingsForSettingPage.taxOnProduct = $scope.billingSettingObj.taxOnProduct;
            $rootScope.taxSettingsForSettingPage.taxOnService = $scope.billingSettingObj.taxOnService;
            $scope.updateDiscountArray(response.data.data.discountData);
            $scope.updateTaxArray(response.data.data.taxData);
            $scope.getServiceLevelPay();
          }
        }
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
        $scope.updateTabScroll();
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    })
  }  
  //get service level pay
  $scope.getServiceLevelPay = function(){
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    let serviceLevel = [];
    apiGateWay.get("/customer_pay", {companyId: $scope.companyId}).then(function(response) {
        if (response.data.status == 200) {
          if(response.data.data){  
            angular.forEach(response.data.data, function(item, index){
              if (serviceLevel.length > 0) {
                let i = serviceLevel.findIndex(x => x.serviceLevelId === item.serviceLevelId);
                if (i > -1) {
                  if (serviceLevel[i].poolType) {
                    serviceLevel[i].poolType.push(item);                  
                  }
                  if(item.customerPayId){
                    serviceLevel[i].isChargeForChemicals = item.isChargeForChemicals == null ? true : item.isChargeForChemicals; 
                    $scope.updateTabScroll();
                  }
                } else {
                  serviceLevel.push({
                    poolType: [item],
                    serviceLevelId: item.serviceLevelId,
                    isSystem: item.isSystem ? item.isSystem : 0,
                    title: item.title,
                    isChargeForChemicals: item.isChargeForChemicals == null ? true : item.isChargeForChemicals
                  })
                }              
              } else {
                  serviceLevel.push({
                    poolType: [item],
                    serviceLevelId: item.serviceLevelId,
                    isSystem: item.isSystem ? item.isSystem : 0,
                    title: item.title,
                    isChargeForChemicals: item.isChargeForChemicals == null ? true : item.isChargeForChemicals
                  })
              }
            })  
          }
          serviceLevel = $rootScope.sortServiceLevel(serviceLevel,'techPayWithPoolTypes')
          $scope.modelBillingSettingObj.serviceLevel = angular.copy(serviceLevel)
          $scope.billingSettingObj.serviceLevel = angular.copy(serviceLevel)
         
        }
        $scope.initialSLoad = false;
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
        $scope.updateTabScroll();
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    })
  }  

  $scope.changeServiceTab = function(index){
    $scope.selectedCustomerPayServiceLevelIndex = index;
  }

  //updated billing setting top section
  $scope.updateServiceLevelPay = function(index, type){   
    if($scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate == $scope.billingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate && type != 'isChargeForChemicals'
    ){return false;}
    $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate = Number($scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate).toFixed(2)
    

      $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate =  $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate.toString(); //reverse masking 
      $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate = $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate.replace(/\$|,/g, ''); //reverse masking 
     

      let postData = {data:{
        "id": $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].customerPayId ? $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].customerPayId : 0,
        "serviceLevelId": $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].serviceLevelId,
        "addressId": 0,
        "waterBodyId": 0,
        "poolTypeId": $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].poolTypeId,
        "rate": $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate ? $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate : 0,
        "isChargeForChemicals": $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].isChargeForChemicals == null ? true : $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].isChargeForChemicals,
        "isChemicalChanged": false
    }}


    if(type == 'isChargeForChemicals'){
      postData.data.isChemicalChanged = true;
    }
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    apiGateWay.send("/customer_pay?companyId="+$scope.companyId, postData).then(function(response) {
        if (response.data.status == 200) {    
          if(type == 'isChargeForChemicals'){
            $scope.toggleGlobalSettingButton(type, $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex], true);
          } else {
            $scope.toggleGlobalSettingButton('poolType', $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index], true);
          }
          $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].customerPayId = response.data.data.id;
          $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate = $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate ? $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index].rate : 0;
          $scope.billingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index] = angular.copy($scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].poolType[index])
            //$scope.addDiscount(response.data.message);   
            //$scope.successMsg = response.data.message;
        
        } else {       
          $scope.errorMsg = response.data.message;
        }
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
        setTimeout(function(){
          $scope.successMsg = '';
          $scope.errorMsg = '';   
          $scope.updateTabScroll
        }, 2000)
        
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    })
  }   
  $scope.toggleChargeForChemical = function(){
    $scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].isChargeForChemicals = angular.copy(!$scope.modelBillingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].isChargeForChemicals);
    $scope.billingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].isChargeForChemicals = angular.copy(!$scope.billingSettingObj.serviceLevel[$scope.selectedCustomerPayServiceLevelIndex].isChargeForChemicals);
    $scope.updateServiceLevelPay(0, 'isChargeForChemicals');
  }
  $scope.updateDiscountArray = function(data){
    if(data && data.length > 0){              
      angular.forEach(data, function(item, index){ 
        $scope.modelBillingSettingObj.discountData[index].value =  item.value ? parseFloat(item.value) : null;
        $scope.billingSettingObj.discountData[index].value = item.value ? parseFloat(item.value) : null;
        if(item.endsAfter){
          $scope.modelBillingSettingObj.discountData[index].endsAfter = parseFloat(item.endsAfter);
          $scope.modelBillingSettingObj.discountData[index].endAfterType = '0';

          $scope.billingSettingObj.discountData[index].endsAfter = parseFloat(item.endsAfter);
          $scope.billingSettingObj.discountData[index].endAfterType = '0';
        } else {
          $scope.modelBillingSettingObj.discountData[index].endsAfter  = null;
          $scope.modelBillingSettingObj.discountData[index].endAfterType  = '1';

          $scope.billingSettingObj.discountData[index].endsAfter = null;
          $scope.billingSettingObj.discountData[index].endAfterType = '1';
        }
      }) 
    }
    $scope.initialDLoad = false;
  }
  //updated billing setting top section
  $scope.updateBillingSettings = function(node='', invoiceNumber=''){     
    if(node && $scope.modelBillingSettingObj[node] == $scope.billingSettingObj[node] || (!$scope.modelBillingSettingObj[node] && !$scope.billingSettingObj[node])){return false;}  
    let tempInvoiceNumber =  angular.copy($scope.modelBillingSettingObj['invoiceStartFrom']);  
    if(invoiceNumber == ''){
      $scope.modelBillingSettingObj['invoiceStartFrom'] = null
    }     
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    apiGateWay.send("/company_billing_settings",  $scope.modelBillingSettingObj).then(function(response) {
        if (response.data.status == 200) { 
          $scope.toggleGlobalSettingButton(node, null, true);
          $scope.modelBillingSettingObj['invoiceStartFrom'] = tempInvoiceNumber; 
          $scope.billingSettingObj[node] = angular.copy($scope.modelBillingSettingObj[node])
         
          if(node == 'invoicedOn'){
            $scope.getServiceLevelPay();
          }
            //$scope.addDiscount(response.data.message);   
            //$scope.successMsg = response.data.message;
        
        } else {       
          $scope.errorMsg = response.data.message;
          
          $('html, body').animate({
            scrollTop: $("#billing-section-error").offset().top
          }, 200);
        }
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
        setTimeout(function(){
          $scope.successMsg = '';
          $scope.errorMsg = '';  
          $scope.updateTabScroll 
        }, 2000)
        
    }, function(error){
      $scope.errorMsg = error;   
      $('html, body').animate({
        scrollTop: $("#billing-section-error").offset().top
      }, 200);
      setTimeout(function(){
        $scope.successMsg = '';
        $scope.errorMsg = '';   
      }, 2000)
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    })
  }   
  //toggle Switch
  $scope.updateInvoiceNumber = function(node){
    if(node == 'invoiceStartFrom' && $scope.modelBillingSettingObj[node] < 100){
      $scope.errorMsg = 'Starting Invoice # should not be less than 100';
          
      $('html, body').animate({
        scrollTop: $("#billing-section-error").offset().top
      }, 200);
      setTimeout(function(){
        $scope.errorMsg = '';   
      }, 2000)
      return false;
    } else {
     
      $scope.updateBillingSettings(node, $scope.modelBillingSettingObj[node]);
    }
    
  }
  //toggle Switch
  $scope.toggleSwitch = function(node){
    $scope.modelBillingSettingObj[node] = angular.copy(!$scope.modelBillingSettingObj[node]);
    $scope.updateBillingSettings(node);
  }
  $scope.toggleNoAccess = function(){
    $scope.modelBillingSettingObj['noAccessToggle'] = angular.copy(!$scope.modelBillingSettingObj['noAccessToggle']);
    apiGateWay.send("/update_company_no_access",  {isNoAccess:$scope.modelBillingSettingObj['noAccessToggle']}).then(function(response) {
      if (response.data.status == 200) {    
        // $scope.successMsg = 'Updated';        
      } else {
        $scope.errorMsg = 'Something went wrong! Please try again.';
      }
      setTimeout(function(){
        $scope.successMsg = '';
        $scope.errorMsg = ''; 
      }, 2000)
    }, function(error){
      $scope.errorMsg = 'Something went wrong! Please try again.';
      setTimeout(function(){
        $scope.successMsg = '';
        $scope.errorMsg = ''; 
      }, 2000)
    })
  }
  //Active inactive billing
  $scope.activeInactiveBilling = function(){    
    $scope.modelBillingSettingObj.activateBilling = angular.copy(!$scope.modelBillingSettingObj.activateBilling);
    $rootScope.activateBilling = angular.copy($scope.modelBillingSettingObj.activateBilling);
    if(!$rootScope.activateBilling){
      $scope.confirmationPopup = ngDialog.open({            
        id  : 11,
        template: 'activateBillingConfirm.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        scope: $scope,
        preCloseCallback: function () {
          if(!$scope.clickedToggle){
            $scope.modelBillingSettingObj.activateBilling = true;
            $scope.clickedToggle = false;
          }
        }
      });
    }
    else{
      $scope.clickedToggle = false;
      $scope.updateBillingSettings('activateBilling');
    }
  }    

  $scope.clickedToggle = false;
  $scope.checkActivateToggle = function () {
    $scope.clickedToggle = true;
  }

  //Add Discount Row
  $scope.addNewDiscountRow = function(index){
    let model = [];
    let discountRow = {            
      "companyId":  $scope.companyId,         
      "endsAfter": "", 
      "endAfterType": "1",
      "id": 0,         
      "title": "", 
      "type": "Fixed Amount", 
      "value": "" ,   
      "endsAfterDurationType": "Months"
    }
    //$scope.modelBillingSettingObj.discountData.unshift(angular.copy(discountRow));   
    //$scope.billingSettingObj.discountData.unshift(angular.copy(discountRow));   
    model.push(angular.copy(discountRow));
    angular.forEach($scope.modelBillingSettingObj.discountData, function(item){
      model.push(item);
    })
    $scope.modelBillingSettingObj.discountData = angular.copy(model);   
    $scope.billingSettingObj.discountData = angular.copy(model);     
  }
  //Add Discount Row
  $scope.addDiscount = function(index, node){
   /*let error = false;
    let tempName = '';
    angular.forEach($scope.modelBillingSettingObj.discountData, function(item, index){
      
      if(tempName == item.name){
        $scope.discountError[index] = {};
        $scope.discountError[index].name = true;
        error = true;
      } else {
        tempName = item.name;
      }
      if($scope.modelBillingSettingObj.discountData[index].value == 0){
        $scope.modelBillingSettingObj.discountData[index].value = null;              
      }
      if(!$scope.modelBillingSettingObj.discountData[index].value || !$scope.modelBillingSettingObj.discountData[index].title ){
          $scope.discountError[index] = {};
          $scope.discountError[index].name = true;
          $scope.discountError[index].value = true;
          error = true;
        }
    })
    if(error){return false}*/

        
    $scope.modelBillingSettingObj.discountData[index].value =  $scope.modelBillingSettingObj.discountData[index].value.toString(); //reverse masking 
    $scope.modelBillingSettingObj.discountData[index].value = $scope.modelBillingSettingObj.discountData[index].value.replace(/\$|,/g, ''); //reverse masking

    if($scope.modelBillingSettingObj.discountData[index].value == 0){
      $scope.modelBillingSettingObj.discountData[index].value = null;              
    }
    if(($scope.modelBillingSettingObj.discountData[index] && 
      $scope.modelBillingSettingObj.discountData[index][node] == $scope.billingSettingObj.discountData[index][node]) || 
      !$scope.modelBillingSettingObj.discountData[index].value ||
      !$scope.modelBillingSettingObj.discountData[index].title 
      ){       
        return false
      }
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    let postData = angular.copy($scope.modelBillingSettingObj.discountData);
    if($scope.modelBillingSettingObj.discountData && $scope.modelBillingSettingObj.discountData.length > 0){
      angular.forEach($scope.modelBillingSettingObj.discountData, function(item, index){
        if(item.endAfterType == '1' ){
          postData[index].endsAfter = null;
          postData[index].endsAfterDurationType = '';
        } else {
          postData[index].endsAfterDurationType = 'Months';
        }
      })  
      

      //$scope.modelBillingSettingObj.discountData.
      apiGateWay.send("/company_discount",  {discounts:postData}).then(function(response) {
        if (response.data.status == 200) {    
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.billingSection = false;
          $scope.modelBillingSettingObj.discountData = angular.copy(response.data.data)
          $scope.billingSettingObj.discountData = angular.copy(response.data.data)
          $scope.updateDiscountArray(response.data.data);
          //$scope.successMsg = msg;
        } else {
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.billingSection = false;
          $scope.errorMsg = response.data.message;
          $('html, body').animate({
            scrollTop: $("#billing-section-error").offset().top
          }, 200);
        }
        setTimeout(function(){
          $scope.successMsg = '';
          $scope.errorMsg = ''; 
          $scope.updateTabScroll 
        }, 2000)
          
      }, function(error){
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
        $scope.errorMsg = error;    
        $('html, body').animate({
          scrollTop: $("#billing-section-error").offset().top
        }, 200);
        setTimeout(function(){
          $scope.successMsg = '';
          $scope.errorMsg = '';  
        }, 2000)
      })
    } else {
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    }

  }

  $scope.setEndAfter = function(index, type){
    if(type == '1'){
      $scope.modelBillingSettingObj.discountData[index].endsAfter = null;
    } else {
      $scope.modelBillingSettingObj.discountData[index].endsAfter = 1; 
    }
    $scope.addDiscount(index, 'endsAfter');
  }
  $scope.checkDeleteAfterInput = function(index, value){
   if(!value){
    $scope.modelBillingSettingObj.discountData[index].endAfterType = '1';
    $scope.modelBillingSettingObj.discountData[index].endsAfter = null;
   } else {
    $scope.addDiscount(index, 'endsAfter');
   }
   
  }
  $scope.updateDiscountType = function(index, type){
    $scope.modelBillingSettingObj.discountData[index].value = null;    
  }
  //Delete Discount
  $scope.discountDeleteConfirm = function(index){
    if($scope.modelBillingSettingObj.discountData[index] && $scope.modelBillingSettingObj.discountData[index].id==0){
      $scope.modelBillingSettingObj.discountData.splice(index, 1);
      $scope.billingSettingObj.discountData.splice(index, 1);
      return;
    }    
    $scope.index = index;
    ngDialog.open({
        template: 'removeDiscountConfirm.html',
        className: 'ngdialog-theme-default',
        scope: $scope,
        preCloseCallback: function () {        
          $scope.type = '';
        }
    });
  }

  $scope.confirmDiscountAction = function(index){
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    ngDialog.closeAll()
    apiGateWay.post("/company_discount_delete?id="+$scope.modelBillingSettingObj.discountData[index].id+"&companyId="+$scope.companyId, {}).then(function(response) {
        if (response.data.status == 200) {
          $scope.modelBillingSettingObj.discountData.splice(index, 1);
        }
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
      $scope.errorMsg = error;    
        $('html, body').animate({
          scrollTop: $("#billing-section-error").offset().top
        }, 200);
    })
  }
 
    //Add Tax Row
    $scope.addNewTaxRow = function(index){
      let model = [];
      let taxRow = {            
        "companyId":  $scope.companyId,         
        "id": 0,         
        "title": "", 
        "amount": "" ,   
        "isDefault": 0
      }  

      $scope.taxSelectedIndex = null;
      
      model.push(angular.copy(taxRow));
      angular.forEach($scope.modelBillingSettingObj.taxData, function(item, index){
        model.push(item);
        if(item.isDefault==1){
          $scope.taxSelectedIndex = index+1;
        }
      })

      $scope.modelBillingSettingObj.taxData = angular.copy(model);   
      $scope.billingSettingObj.taxData = angular.copy(model);     
    }

    $scope.updateTaxArray = function(data){      
      $rootScope.taxSettingsForSettingPage.taxData = data;
      if(data && data.length > 0){         
        $scope.taxSelectedIndex = null;
        angular.forEach(data, function(item, index){ 
          if(item.isDefault==1){
            $scope.taxSelectedIndex = index;
          }
        });
      }
    }

    //Add Tax value
  $scope.addTax = function(index, node){
    if(node == 'title'){
      angular.forEach($scope.billingSettingObj.taxData, function(item){
        if(item.title.toLowerCase() == $scope.modelBillingSettingObj.taxData[index].title.toLowerCase()){
          $rootScope.getCompanyBillingSettings();
          throw 'Break';
        }
      });
    }
    if (($scope.modelBillingSettingObj.taxData[index] &&
      $scope.modelBillingSettingObj.taxData[index][node] == $scope.billingSettingObj.taxData[index][node]) ||
      !$scope.modelBillingSettingObj.taxData[index].amount ||
      !$scope.modelBillingSettingObj.taxData[index].title
    ) {
      return;
    }
     $scope.isProcessing = true;
     $rootScope.settingPageLoaders.billingSection = true;
     let postData = angular.copy($scope.modelBillingSettingObj.taxData);
     if($scope.modelBillingSettingObj.taxData && $scope.modelBillingSettingObj.taxData.length > 0){  
       apiGateWay.send("/company_tax",  {taxes:postData}).then(function(response) {
         if (response.data.status == 200) {    
           let dataForGlobalSettings = $scope.modelBillingSettingObj.taxData[index];
           if (node == 'isDefault') {
              if (dataForGlobalSettings.isDefault == 0) {
                dataForGlobalSettings = { id: 'none', isDefault: 1 }
              }
              $scope.toggleGlobalSettingButton('taxRates', dataForGlobalSettings, true);
           }           
           $scope.isProcessing = false;
           $rootScope.settingPageLoaders.billingSection = false;
           if (response.data.data && response.data.data.length > 0) {
            angular.forEach(response.data.data, function(item){
              item.amount = Number(item.amount)
            });
           }           
           $scope.modelBillingSettingObj.taxData = angular.copy(response.data.data)
           $scope.billingSettingObj.taxData = angular.copy(response.data.data)
           
           $scope.updateTaxArray(response.data.data);
         } else {
           $scope.isProcessing = false;
           $rootScope.settingPageLoaders.billingSection = false;
           $scope.errorMsg = response.data.message;  
            $('html, body').animate({
              scrollTop: $("#billing-section-error").offset().top
            }, 200);
         }
         setTimeout(function(){
           $scope.successMsg = '';
           $scope.errorMsg = '';  
         }, 2000)
           
       }, function(error){
         $scope.errorMsg = error;    
         $scope.isProcessing = false;
         $rootScope.settingPageLoaders.billingSection = false;
         $scope.errorMsg = error;    
          $('html, body').animate({
            scrollTop: $("#billing-section-error").offset().top
          }, 200);
         setTimeout(function(){
           $scope.successMsg = '';
           $scope.errorMsg = '';  
         }, 2000)
       })
     } else {
       $scope.isProcessing = false;
       $rootScope.settingPageLoaders.billingSection = false;
     }
 
   }

   $scope.setTaxDefault = function(node){
    angular.forEach($scope.modelBillingSettingObj.taxData, function(item, index){ 
      if(node == index){
        $scope.modelBillingSettingObj.taxData[index].isDefault = 1; 
      }else{
        $scope.modelBillingSettingObj.taxData[index].isDefault = 0; 
      }
    });
      $scope.addTax(node,'isDefault');   
   }
   $scope.setTaxDefaultNone = function(){
     let oldDefault = 0;
    angular.forEach($scope.modelBillingSettingObj.taxData, function(item, index){ 
        if(item.isDefault==1){
          oldDefault = index;
        }
        $scope.modelBillingSettingObj.taxData[index].isDefault = 0; 
    });
     $scope.addTax(oldDefault,'isDefault');   
     $scope.toggleGlobalSettingButton('taxRates', { id: 'none', isDefault: 1}, true)   
   }

   $scope.taxDeleteConfirm = function(index){
    if($scope.modelBillingSettingObj.taxData[index] && $scope.modelBillingSettingObj.taxData[index].id==0){
      $scope.modelBillingSettingObj.taxData.splice(index, 1);
      $scope.billingSettingObj.taxData.splice(index, 1);

      setTimeout(function(){
        $scope.taxSelectedIndex--;
      }, 10)

      return;
    }  
    $scope.taxIndex = index;
    ngDialog.open({
        template: 'removeTaxConfirm.html',
        className: 'ngdialog-theme-default',
        scope: $scope,
        preCloseCallback: function () {        
          $scope.type = '';
        }
    });
  }

  $scope.confirmTaxAction = function(index){
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    ngDialog.closeAll()
   apiGateWay.post("/company_tax_delete?id="+$scope.modelBillingSettingObj.taxData[index].id, {}).then(function(response) {
        if (response.data.status == 200) {
          $scope.modelBillingSettingObj.taxData.splice(index, 1);
          $scope.taxSelectedIndex = null;
          angular.forEach($scope.modelBillingSettingObj.taxData, function(item, index){ 
            if(item.isDefault==1){
              $scope.taxSelectedIndex = index;
            }
          });
          $rootScope.getCompanyBillingSettings();
        }
       

        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.billingSection = false;
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    })
  }
  $scope.scrollServiceLevelTab = '';
  $scope.scrollServiceLevelTab = function (direction){    
      var speed=25,distance=100,step=10;
      var element = document.querySelectorAll('.service-tab-one')[0];
      var scrollAmount = 0;
      var slideTimer = setInterval(function(){
          if(direction == 'left'){
              element.scrollLeft -= step;
          } else {
              element.scrollLeft += step;
          }
          scrollAmount += step;
          if(scrollAmount >= distance){
              window.clearInterval(slideTimer);
          }
      }, speed);
  }
  var tabUpdateIntervalIns = '';  
      $scope.updateTabScroll = function(){
      tabUpdateIntervalIns = setTimeout(function(){ 
          $scope.tabContainerWidth = 0;
          var ele = document.querySelectorAll('#serviceTab3')[0];
          for (var i = 0; i < angular.element(ele).children().length; i++) {
          $scope.tabContainerWidth += angular.element(ele).children()[i].clientWidth;
          }
          $scope.tabContainerWidth += 1;   
          if(window.innerWidth > 1920) {
            $scope.tabContainerWidth += 7;   
          }
          $scope.$apply();
      }, 100)     
  }  
  $scope.$watch('chemicalReadingServiceArray', function (newVal, oldVal) {    
    if(newVal){
      $scope.updateTabScroll();
    }            
  }, true);  
  $scope.clearTabUpdateInterval = function(){
      if(tabUpdateIntervalIns){clearTimeout(tabUpdateIntervalIns);}
  }
  $scope.selectTab = function(tabIndex, force=false){
      if($scope.selectedWaterBody !== tabIndex || force){
          $scope.selectedWaterBody = tabIndex;
          $scope.updateTabScroll(); 
          $scope.getChecklistByWaterBodyId($scope.waterBodies[tabIndex].id)
          $scope.getGallonsByWaterBodyId($scope.waterBodies[tabIndex].id)
          if (angular.isDefined($rootScope.getEquipmentDetails) && angular.isFunction($rootScope.getEquipmentDetails)) {$rootScope.getEquipmentDetails($scope.waterBodies[tabIndex]);}            
          if (angular.isDefined($rootScope.getJobDetailByWaterBody) && angular.isFunction($rootScope.getJobDetailByWaterBody)) {$rootScope.getJobDetailByWaterBody($scope.waterBodies[tabIndex]);}
      }       
  }
  $scope.updateTaxableSetting = function(type){    
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.billingSection = true;
    var postData = {
      taxOnProduct: type === 'taxOnProduct' ? 1 - $scope.billingSettingObj.taxOnProduct : $scope.billingSettingObj.taxOnProduct,
      taxOnService: type === 'taxOnService' ? 1 - $scope.billingSettingObj.taxOnService : $scope.billingSettingObj.taxOnService,
    };
    apiGateWay.send("/company_item_tax", postData).then(function(response) {
        if (response.data.status == 200) {
          if(response.data.data){ 
            $scope.billingSettingObj.taxOnProduct = postData.taxOnProduct;
            $scope.billingSettingObj.taxOnService = postData.taxOnService;
            $rootScope.taxSettingsForSettingPage.taxOnProduct = postData.taxOnProduct;  
            $rootScope.taxSettingsForSettingPage.taxOnService = postData.taxOnService;  
          }
          $scope.isProcessing = false;
          $rootScope.settingPageLoaders.billingSection = false;
        }
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.billingSection = false;
    })
  }  
  $scope.globalSettingButtonVisibility = {
    customersPay: false,
    invoicedOn: false,
    terms: false,
    isAutoEmailInvoice: false,
    isChargeForChemicals: {},
    poolTypes: {},
    taxRates: {},
  }
  $scope.toggleGlobalSettingButton = function(type, data, status=true) {  
    if (type == 'isChargeForChemicals') {
      $scope.globalSettingButtonVisibility.isChargeForChemicals['charge_for_chem_toggle_'+data.serviceLevelId] = status;
    } else if (type == 'poolType') {
      $scope.globalSettingButtonVisibility.poolTypes[data.serviceLevelId+'_pooltype_'+data.poolTypeId] = status;
    }  else if (type == 'taxRates') {      
      $scope.globalSettingButtonVisibility.taxRates = {};  
      $scope.globalSettingButtonVisibility.taxRates['taxRates_'+(data.id ? data.id : data.taxId)] = status;
    } else {
      $scope.globalSettingButtonVisibility[type] = status;;
    }
  }
  $scope.confirmModalForGlobalSettings = null;
  $scope.selectedDataToUpdateGlobally = null;
  $scope.openConfirmModalForGlobalSettings = function(type, data) { 
    let value = {};
    if (type === 'customersPay') {
      value.customersPay = data.customersPay;
      if (data.customersPay == 'Per Visit') {
        value.noAccessToggle = data.noAccessToggle;
      }
    }
    if (type === 'invoicedOn') {
      value.invoicedOn = data.invoicedOn;
    }
    if (type === 'terms') {
      value.terms = data.terms;
    }
    if (type === 'isAutoEmailInvoice') {
      value.isAutoEmailInvoice = data.isAutoEmailInvoice;
    }
    if (type === 'isChargeForChemicals') {
      value.serviceLevelId = data.serviceLevelId;
      value.isChargeForChemicals = data.isChargeForChemicals;
    }
    if (type === 'poolType') {
      value.serviceLevelId = data.serviceLevelId;
      value.poolTypeId = data.poolTypeId;
      value.rate = data.rate;
      value.isLockValueOverride = false;
    }
    if (type === 'taxRates') {
      value.taxId = data.id;
      if (data.id != 'none') {
        value.amount = data.amount;
        value.isDefault = data.isDefault;
        value.title = data.title;
      } else {
        value.isDefault = data.isDefault;
      }
    }
    $scope.selectedDataToUpdateGlobally = {
      actionType: type,
      value: value
    };
    $scope.globalSettingSucess = '';
    $scope.globalSettingError = '';    
    $scope.confirmModalForGlobalSettings = ngDialog.open({                  
      template: 'confirmModalForGlobalSettings.html',
      className: 'ngdialog-theme-default v-center',
      closeByDocument: !$scope.globalSettingsUpdating,
      overlay: true,
      scope: $scope,
      preCloseCallback: function () {
        $scope.selectedDataToUpdateGlobally = null;
      }
    });    
  }
  $scope.setIsLockValueOverride = function(e) {
    $scope.selectedDataToUpdateGlobally.value.isLockValueOverride = e.target.value == 'true'
  }
  $scope.globalSettingSucess = '';
  $scope.globalSettingError = '';
  $scope.globalSettingsUpdating = false;
  $scope.updateGlobalSettings = function() {
    let selectedDataToUpdateGlobally = angular.copy($scope.selectedDataToUpdateGlobally);
    $scope.globalSettingsUpdating = true;
    $scope.globalSettingSucess = '';
    $scope.globalSettingError = '';           
    apiGateWay.send("/update_billing_setting_bulk",  selectedDataToUpdateGlobally).then(function(response) {          
      if (response && response.data && response.data.status == 200) {
        $scope.confirmModalForGlobalSettings.close();
        let updatedFor = '';
        if (selectedDataToUpdateGlobally.actionType === 'customersPay') {
          updatedFor = 'customers pay'
        }
        if (selectedDataToUpdateGlobally.actionType === 'invoicedOn') {
          updatedFor = 'invoiced on'
        }
        if (selectedDataToUpdateGlobally.actionType === 'terms') {
          updatedFor = 'terms'
        }
        if (selectedDataToUpdateGlobally.actionType === 'isAutoEmailInvoice') {
          updatedFor = 'auto email invoice'
        }
        if (selectedDataToUpdateGlobally.actionType === 'isChargeForChemicals') {
          updatedFor = 'charge for chemicals'
        }
        if (selectedDataToUpdateGlobally.actionType === 'poolType') {
          updatedFor = 'pool type'
        }
        if (selectedDataToUpdateGlobally.actionType === 'taxRates') {
          updatedFor = 'tax rates'
        }
        $scope.globalSettingSucess = 'Global setting updated for ' + updatedFor;     
        $scope.globalSettingsUpdating = false;    
        $scope.toggleGlobalSettingButton(selectedDataToUpdateGlobally.actionType, selectedDataToUpdateGlobally.value, false);        
        $timeout(function(){
          $scope.globalSettingSucess = '';
        }, 2000);
      } else {
        $scope.globalSettingError = 'Something went wrong!';
        $timeout(function(){
          $scope.globalSettingError = '';
        }, 2000);
        $scope.globalSettingsUpdating = false;
      }        
    }, function(error){      
      $scope.globalSettingsUpdating = false;
      $scope.globalSettingError = typeof error == 'string' ? error : 'Something went wrong!';
      $timeout(function(){
        $scope.globalSettingError = '';
      }, 2000);
    })
  }  
});
