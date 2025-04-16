angular.module('POOLAGENCY')

.controller('customerBillingTabController', function($rootScope, $scope, apiGateWay, ngDialog, auth, configConstant, $locale, $stateParams, commonService, getPaymentConfig, $timeout) {  
  $scope.selectedEvn = configConstant.currEnvironment;
  $scope.companyId = auth.getSession() ? auth.getSession().companyId : '';
  $scope.payaError = {};
  $scope.payaConfig = {};
  $scope.modeEdit = false;
  $scope.modelPaymentMethodData = { 
    paymentProfileName: null, 
    card: 'test',
    notes: ''
  }
  $scope.paymentProfiles = [];
  $scope.initialCheck = false;
  $scope.billingAddress = {};
  $scope.addressId = $stateParams.addressId;
  $scope.stepOne = true;
  $scope.stepTwo = false;
  $scope.currentYear = new Date().getFullYear()
  $scope.currentMonth = new Date().getMonth() + 1
  $scope.months = $locale.DATETIME_FORMATS.MONTH
  $scope.ccinfo = {type:undefined}
  $scope.combineInvoiceError = ''; 
  $scope.billingErrorMsg = "";
  $scope.payaData = {};
  $scope.$watch('billingAddObj', function (newVal, oldVal) {  
    if(newVal){ 
      $scope.billingAddress = angular.copy($rootScope.billingAddObj);  
    }  
  }, true);
  $scope.$watch('customerDepartmentId', function (newVal, oldVal) { 
    $scope.selectedCustomerDepartment = $rootScope.findDepartmentById(newVal);    
  }, true);
  $scope.$watch('customerBillingData', function (newVal, oldVal) { 
    if(!$scope.initialCheck && Object.keys(newVal).length > 0 ){
      $scope.initialCheck = true;
      $scope.modelCustomerBillingData = angular.copy($rootScope.customerBillingData);
      setTimeout(function(){$scope.getPaymentProfile()}, 1000)
    }  
    if(newVal){ 
      $scope.modelCustomerBillingData = angular.copy($rootScope.customerBillingData);  
    }
  }, true);
  $scope.$watch('watchPaymentMethodId', function (newVal, oldVal) { 
   
    if(newVal != oldVal){   
      $scope.getPaymentProfile();
    }  
  }, true);
  $scope.$on("$destroy", function () {
    $rootScope.customerBillingData = {};
    $rootScope.customerDepartmentId = null;
    $rootScope.billingAddObj= {};
    $scope.modelCustomerBillingData = {};
  })
  //Get Payment Profile
  $scope.getPaymentProfile = function(){  
   // if($scope.modelCustomerBillingData.customer){
    //Rajendra : In case of section refresh due to watch added on scope variables
   // some times it happened cid is flused out from scope
   // so tried to reset value from parent scope, LS or local model
      // if(!$scope.$parent || !$scope.$parent.customerId){
      //     var cId = auth.getStorage('cId');
      //     if($scope.modelCustomerBillingData.customer && $scope.modelCustomerBillingData.customer.customerId){
      //         $scope.$parent.customerId = $scope.modelCustomerBillingData.customer.customerId;
      //     }else if(cId){
      //       $scope.$parent.customerId = cId;
      //     }else{
      //         $scope.billingErrorMsg = "Payment profile list failed, Please reload and try again."          
      //     } 
      // }else{
      //   //save CID in storage on first landing
      //   auth.setStorage('cId', $scope.$parent.customerId)
      // }
      apiGateWay.get("/payment_profile",  { addressId: $scope.addressId }).then(function(response) {
        if (response.data.status == 200) {    
          $scope.paymentProfiles = response.data.data;   
        } else {    
          $scope.paymentProfiles = [];   
          $scope.errorMsg = response.data.message;
        }            
      }, function(error){
        $scope.paymentProfiles = []; 
      })
   // }
    
  }  
  //updated billing Terms
  $scope.updateBilling = function(node=''){
    if(node && $scope.modelCustomerBillingData[node] == $scope.customerBillingData[node] || (!$scope.modelCustomerBillingData[node] && !$scope.customerBillingData[node])){return false;}
    let postData = {
      customerId: $scope.modelCustomerBillingData.customer.customerId,     
    }    
    postData[node] = $scope.modelCustomerBillingData[node];
    let apiURL = '/update_customer_terms';
    if(node == 'isCombineInvoices'){
      apiURL = '/update_customer_invoice_type';
    }
    
    $scope.isProcessing = true;
    apiGateWay.send(apiURL,  postData).then(function(response) {
        if (response.data.status == 200) {    
          $scope.customerBillingData[node] = angular.copy($scope.modelCustomerBillingData[node]);
        } else {
          $scope.errorMsg = response.data.message;
        }
        $scope.isProcessing = false;
        setTimeout(function(){
          $scope.successMsg = '';
          $scope.errorMsg = '';   
        }, 2000)
        
    }, function(error){
      if(node == 'isCombineInvoices'){
        $scope.modelCustomerBillingData[node] = false;
        $scope.combineInvoiceError = error
        setTimeout(function(){
          $scope.combineInvoiceError = '';  
        }, 1500)
      }
      $scope.isProcessing = false;
    })
  }  
  
  // $scope.updateTax = function(taxRateDataList){
  //   $scope.modelCustomerBillingData.taxTitle = taxRateDataList.title
  //   $scope.modelCustomerBillingData.taxPercentValue = taxRateDataList.amount
  //   let taxRateData = {
  //       "taxTitle":taxRateDataList.title,
  //       "taxPercentValue" : taxRateDataList.amount, 
  //       "companyId": $rootScope.companyId,
  //       "addressId": $rootScope.customerBillingData.customer.addressId,
  //       "isRemove": 0,
  //   };
  //   $scope.isProcessing = true;
  //   apiGateWay.send("/update_customer_tax ", taxRateData).then(function(response) {
  //       if (response.data.status == 201) {

  //       } else {
  //           $scope.errorProductForm = 'Error';
  //       }
  //       $scope.isProcessing = false;
  //   },function(error) {            
  //       $scope.isProcessing = false;
  //       $scope.errorProductForm = error;
  //       setTimeout(function() {
  //           $scope.errorProductForm = "";
  //       }, 2000);
  //   });
  // }   

  $scope.removeTax = function(){
    $scope.modelCustomerBillingData.taxTitle = ''
    $scope.modelCustomerBillingData.taxPercentValue = ''
    let taxRateData = {
        "taxTitle":'',
        "taxPercentValue" : '', 
        "companyId": $rootScope.companyId,
        "addressId": $rootScope.customerBillingData.customer.addressId,
        "isRemove": 1,
    };
    $scope.isProcessing = true;
    apiGateWay.send("/update_customer_tax ", taxRateData).then(function(response) {
        if (response.data.status == 201) {

        } else {
            $scope.errorProductForm = 'Error';
        }
        $scope.isProcessing = false;
    },function(error) {            
        $scope.isProcessing = false;
        $scope.errorProductForm = error;
        setTimeout(function() {
            $scope.errorProductForm = "";
        }, 2000);
    });
  }   


  $scope.toggleSwitch = function(node){
    $scope.modelCustomerBillingData[node] = angular.copy(!$scope.modelCustomerBillingData[node]);
    $scope.updateBilling(node);
  }
  /*$scope.decryptMsg = function (data) {
    master_key = '6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e51';
    // Decode the base64 data so we can separate iv and crypt text.
    var rawData = atob(data);
    // Split by 16 because my IV size
    var iv = rawData.substring(0, 16);
    var crypttext = rawData.substring(16);
    //Parsers
    crypttext = CryptoJS.enc.Latin1.parse(crypttext);
    iv = CryptoJS.enc.Latin1.parse(iv); 
    key = CryptoJS.enc.Utf8.parse(master_key);

    // Decrypt
    var plaintextArray = CryptoJS.AES.decrypt(
      { ciphertext:  crypttext},
      key,
      {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
    );

    // Can be Utf8 too
    output_plaintext = CryptoJS.enc.Latin1.stringify(plaintextArray);
  }*/
  
  
  //get Paya Setting
  $rootScope.getPayaSettings = function(){
    $scope.settingDataAvailable = false;
    apiGateWay.get("/company_paya_details").then(function(response) {
      if (response.data.status == 200) {
          if(response.data.data){  
            $scope.payaData = response.data.data;
            $rootScope.customerBillingData.payaStatus = $scope.payaData.status;
          }
        }
        $scope.isProcessing = false;
    }, function(error){
      $scope.isProcessing = false;
    })
  }  
   //updated billing Terms   
  $scope.paymentGatewayName = '';
  $scope.addPaymentMethod = function(index, obj){  
    $scope.obj = obj; 
    if(obj && obj.accountVaultId){
      $scope.modeEdit = true;  
      if (obj.userPaymentOptionId && obj.userPaymentOptionId != null) {
        $scope.paymentGatewayName = $rootScope.paymentGateWayNames.nuvei;
      } else {          
        $scope.paymentGatewayName = $rootScope.paymentGateWayNames.paya;
      }   
      $scope.modelPaymentMethodData = { 
        accountVaultId: obj.accountVaultId,
        id: obj.id,
        paymentProfileName: obj.paymentProfileName,
        accountHolderName: obj.accountHolderName == 'None' ? '' : obj.accountHolderName,
        routingNumber: null,
        accountNumber: '******'+obj.accountLastFourDigits,
        card:obj.paymentMethod == 'ach' ? 'ACH' : 'Credit Card', 
        accountType:obj.accountType ? obj.accountType : null,
        notes: obj.notes ? obj.notes : null,
      }      
      if(obj.paymentMethod == 'cc'){
        $scope.ccinfo.number = '******'+obj.accountLastFourDigits;
        let date = obj.expiryDate.split("/")
        $scope.ccinfo.month = date[0];
        if (obj.userPaymentOptionId && obj.userPaymentOptionId != null) {
          $scope.ccinfo.year = date[1]
        } else {          
          $scope.ccinfo.year = '20'+date[1]
        }         
        $scope.ccinfo.billing_address = obj.billing_address ? obj.billing_address : null;
        $scope.ccinfo.billing_zip = obj.billing_zip ? obj.billing_zip : null;
      }
    } else {
      $scope.modeEdit = false;
      $scope.modelPaymentMethodData = { 
        accountVaultId: null,
        id: null,
        paymentProfileName: null,       
        notes: null,
        card: null
      }
    }
    ngDialog.open({
      id  : 10,
      template: 'addPaymentMethodPopup.html',
      className: 'ngdialog-theme-default v-center',
      overlay: true,
      closeByNavigation: true,
      closeByDocument: false,
      scope: $scope,
      preCloseCallback: function() {     
          $scope.errorMsg = '';             
          $scope.serviceLevelModel = {};    
          $scope.index = '';  
          $scope.modeEdit = false;    
          $scope.obj = ''; 
          $scope.stepOne = true;
          $scope.stepTwo = false;          
      }
    });
   
  }
  companyId = (auth.getSession().userType == "administrator" || auth.getSession().canAccessMultiCompany) ? $rootScope.selectedCompany : $scope.companyId;
  getPaymentConfig.get(companyId).then(function(res){
    $scope.payaConfig = res;
  })
  $scope.initiateProfileWindow = function(){  
    if($scope.modelCustomerBillingData.customer){
      $scope.isProcessing = true;      
      $scope.stepTwo = true;     
      $scope.modelCustomerBillingData.customer.displayName = $scope.modelCustomerBillingData.customer.displayName.replaceAll(/\s+/ig, ' ');
      $scope.modelCustomerBillingData.customer.displayName = $scope.modelCustomerBillingData.customer.displayName.replace(/[^\x00-\x7F]/g, '');
      $scope.stepOne = false;  
      let _companyId = (auth.getSession().userType == "administrator" || auth.getSession().canAccessMultiCompany) ? $rootScope.selectedCompany : $scope.companyId;
      let billingAddress = {
            displayName: $scope.modelCustomerBillingData.customer.displayName || '',
            firstName: $scope.modelCustomerBillingData.customer.firstName || '',
            lastName: $scope.modelCustomerBillingData.customer.lastName || '',
            email: $scope.modelCustomerBillingData.customer.email || '',
            country: $scope.modelCustomerBillingData.customer.country || 'US',
            address: $scope.modelCustomerBillingData.customer.billing_street || '',
            city: $scope.modelCustomerBillingData.customer.billing_city || '',
            state: $scope.modelCustomerBillingData.customer.billing_state || '',
            zip: $scope.modelCustomerBillingData.customer.billing_zip || '',
      }
      let widgetData = { 
        section: 'payment_profile_area',
        companyId: _companyId,
        type: $scope.modelPaymentMethodData.card == 'ACH' ? 'ach' : 'cc',  
        prefix_transaction_id: $scope.modelCustomerBillingData.customer.addressId,      
        userTokenId: $scope.modelCustomerBillingData.customer.customerId,
        amount: 0,
        billingAddress: billingAddress,
        sessionToken: null 
      };
      $scope.isProcessing = false;   
      $rootScope.initiatePaymentFormEvent(widgetData);
    }
  } 

  $rootScope.isInitiatePaymentFormClosed_billing_tab = function(data) {
      $scope.isProcessing = false;
      $scope.stepTwo = false;
      $scope.stepOne = true;
  }
  $rootScope.root_addPaymentProfile = function(data) {
    $scope.addPaymentProfile(data)
  }
  $scope.flattenErrors = function(payaError) {
    if (!payaError) return [];
    return [].concat.apply([], Object.values(payaError));
  };
  $scope.payaErrors = '';
  $scope.addPaymentProfileInPaya = function(model, info){

    $scope.isProcessing = true;
    let postData = {};
    if($scope.modeEdit){
    
      postData = {       
        "accountvault": {
          "payment_method": model.card == 'ACH' ? 'ach' : 'cc', //data.payment_method,                         
          "location_id": $scope.payaConfig['location-id']
        }
      }  
      if(model.card != 'ACH'){
        postData.accountvault.exp_date = info.month+info.year.toString().substr(-2);
        postData.accountvault.billing_address = info.billing_address;
        postData.accountvault.billing_zip = info.billing_zip;
      }
    } else {
      postData = {       
        "accountvault": {
          "payment_method": model.card == 'ACH' ? 'ach' : 'cc', //data.payment_method,
          "account_holder_name": model.accountHolderName, //data.account_holder_name,
          "account_id": null,             
          "location_id": $scope.payaConfig['location-id']
        }
      }  
  
      if(model.card == 'ACH'){
        postData.accountvault.account_type = model.accountType ;
        postData.accountvault.routing = model.routingNumber ;
        postData.accountvault.is_company = false;
        postData.accountvault.account_number = model.accountNumber;
      } else {
        postData.accountvault.exp_date = info.month+info.year.toString().substr(-2);
        postData.accountvault.account_number = info.number; 
      }
    }
    let options = {
      headers: {
        'user-id' : $scope.payaConfig['user-id'],
        'user-api-key': $scope.payaConfig['user-api-key'],
        'developer-id': $scope.payaConfig['developer-id'],
      }
    }
    //endpoint, method, data, options
    // Nuvei
    if ($scope.obj.userPaymentOptionId && $scope.obj.userPaymentOptionId != null) {
      let _data = angular.copy($scope.obj);
      _data.paymentGateway = $rootScope.paymentGateWayNames.nuvei;
      $scope.addPaymentProfile(_data)
      // 
    } else { // paya
      apiGateWay.payaAPI($scope.payaConfig['url']+"accountvaults"+($scope.modeEdit ? '/'+$scope.modelPaymentMethodData.accountVaultId : ''), ($scope.modeEdit ? 'PUT' : 'POST'), JSON.stringify(postData), options ).then(function(response) {
        if (response.status == 201 || response.status == 200) {  
          response.data.accountvault.paymentGateway = $rootScope.paymentGateWayNames.paya;
          $scope.addPaymentProfile(response.data.accountvault)
          $scope.payaError = {};
        } else {
          $scope.isProcessing = false;
        }        
      }, function(error){
        if(error.data && error.data.errors){
          $scope.payaErrors = $scope.flattenErrors(error.data.errors);
          $timeout(function(){
            $scope.payaErrors = '';
          }, 4000)
          $scope.payaError = error.data.errors
        }
        $scope.isProcessing = false;
      })
    }        
  }

  $scope.addPaymentProfile = function(data){   
    let apiUrl = '/payment_profile?customerId='+$scope.modelCustomerBillingData.customer.customerId;
    if($scope.modeEdit){
      apiUrl = "/update_payment_profile?customerId="+$scope.modelCustomerBillingData.customer.customerId+'&id='+$scope.modelPaymentMethodData.id
    }
    let postData = {}; 
    // if paya
    if (data.paymentGateway === $rootScope.paymentGateWayNames.paya) {
      if($scope.modeEdit){        
        postData = {
          "data": {
              "paymentProfileName": $scope.modelPaymentMethodData.paymentProfileName,
              "notes": $scope.modelPaymentMethodData.notes ? $scope.modelPaymentMethodData.notes: null,
              "accountType": data.account_type ? data.account_type : null,
              "paymentMethod":data.payment_method ? data.payment_method : null,
          }
        }
      } else {
        postData = {
          "data": {
            "accountVaultId" : data.id,
            "paymentProfileName": $scope.modelPaymentMethodData.paymentProfileName ? $scope.modelPaymentMethodData.paymentProfileName : null,
            "paymentMethod": data.payment_method ? data.payment_method : null,
            "accountHolderName": data.account_holder_name ? data.account_holder_name : null,
            "accountType": data.account_type ? data.account_type : null,
            "accountLastFourDigits": data.last_four ? data.last_four : null,
            "notes": $scope.modelPaymentMethodData.notes ? $scope.modelPaymentMethodData.notes: null,
            "expiryDate": null
          }
        }  
      } 
      postData.data.accountVaultApiId = data.account_vault_api_id
      postData.data.responseText = data;
      if($scope.modelPaymentMethodData.card == 'ACH'){
        postData.data.expiryDate = null;
      } else {
        if (typeof data.exp_date === 'string' || data.exp_date instanceof String){
          postData.data.expiryDate =  data.exp_date.toString().substr(0, 2)+'/'+data.exp_date.toString().substr(2, 2);
        }
      }
    }
    // if nuvei
    if (data.paymentGateway === $rootScope.paymentGateWayNames.nuvei) {     
      if($scope.modeEdit){        
        // return
        postData = {
          "data": {
            "userTokenId": data.userTokenId,
            "userPaymentOptionId": data.userPaymentOptionId,
            "paymentProfileName": $scope.modelPaymentMethodData.paymentProfileName,
            "notes": $scope.modelPaymentMethodData.notes ? $scope.modelPaymentMethodData.notes: null,
            "paymentMethod":data.paymentMethod ? data.paymentMethod : null,
          }
        }
        if (data.paymentMethod == 'cc') {
            postData.data.ccExpMonth = $scope.ccinfo.month;
            postData.data.ccExpYear = $scope.ccinfo.year;
            postData.data.ccNameOnCard = $scope.modelPaymentMethodData.accountHolderName;
            postData.data.expiryDate = $scope.ccinfo.month +'/'+ $scope.ccinfo.year;
            
        }
      } else {        
        postData = {
          "data": {
            "accountVaultId" : data.responseText.userPaymentOptionId,
            "paymentProfileName": $scope.modelPaymentMethodData.paymentProfileName ? $scope.modelPaymentMethodData.paymentProfileName : null,
            "paymentMethod": data.paymentMethod ? data.paymentMethod : null,
            "accountHolderName": data.responseText.account_holder_name ? data.responseText.account_holder_name : null,
            "accountLastFourDigits": data.responseText.last4Digits ? data.responseText.last4Digits : null,
            "notes": $scope.modelPaymentMethodData.notes ? $scope.modelPaymentMethodData.notes: null,
            "userPaymentOptionId": data.responseText.userPaymentOptionId,
            "accountVaultApiId": $scope.modelCustomerBillingData.customer.customerId + '_' + Math.floor(Date.now() / 1000),
            "userTokenId": $scope.modelCustomerBillingData.customer.customerId,
            "responseText": data.responseText,
          }
        }          
      } 
    }     
    // 
    apiGateWay.send(apiUrl,  postData).then(function(response) {
        if (response.data.status == 200) {              
            $scope.successMsg = response.data.message;   
            $scope.getPaymentProfile()
            ngDialog.closeAll()     
        } else {       
            $scope.errorMsg = response.data.message;
        }
        $scope.isProcessing = false;
        setTimeout(function(){
          $scope.successMsg = '';
          $scope.errorMsg = '';   
        }, 1500)
        
    }, function(error){
      $scope.isProcessing = false;
    })
  }  
 
  $scope.selectCardType = function(){
    //$scope.initiateProfileWindow();
  }
  $scope.paymentMethodDeleteConfirm = function(obj){   
    $scope.obj = obj
    $scope.deletePopup = ngDialog.open({
        template: 'deletePaymentMethodConfirm.html',
        className: 'ngdialog-theme-default v-center',       
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function () {         
          //$scope.obj = ''; 
        }
    });
  }
  $scope.paymentMethodDeleteAction = function(){
    // Nuvei
    if ($scope.obj.userPaymentOptionId && $scope.obj.userPaymentOptionId != null) {
      $scope.deleteProfileFromPB();
    } else { // paya
      $scope.isProcessing = true;    
      let options = {
        headers: {
          'user-id' : $scope.payaConfig['user-id'],
          'user-api-key': $scope.payaConfig['user-api-key'],
          'developer-id': $scope.payaConfig['developer-id'],
        }
      }
      //endpoint, method, data, options
      apiGateWay.payaAPI($scope.payaConfig['url']+"accountvaults/"+$scope.obj.accountVaultId, 'DELETE',{}, options).then(function(response) {      
          if (response.status == 204) {  
            $scope.deleteProfileFromPB();
          }      
      }, function(error){
        if(error.data.status == 404){
          $scope.errorMsg = error.data.message;
          $timeout(()=>{ $scope.errorMsg = ''; }, 3000)
          $scope.deletePopup.close();
          $scope.isProcessing = false;
        } 
        if(error.data.status == 410){
          $scope.deleteProfileFromPB();        
        } 
        if(error.data.errors && error.data.errors){
          $scope.payaError = error.data.errors
        }
        $scope.isProcessing = false;
      })
      return false;
    }        
  }
  $scope.deleteProfileFromPB = function() {    
    $scope.isProcessing = true;
    let params = new URLSearchParams({
      customerId: $scope.modelCustomerBillingData.customer.customerId,
      id: $scope.obj.id
    });
    if ($scope.obj.userPaymentOptionId && $scope.obj.userPaymentOptionId != null) {
      params.append("userPaymentOptionId", $scope.obj.userPaymentOptionId);
    }
    apiGateWay.send(`/delete_payment_profile?${params.toString()}`, {}).then(function(response) {
      if (response.data.status == 200) {
        $scope.getPaymentProfile()
        ngDialog.closeAll()         
      }         
      $scope.isProcessing = false;
    }, function(error){
      $scope.isProcessing = false;
      
    })
  }
  $scope.backToStepOne = function(){
    $scope.stepOne = true;
    $scope.stepTwo = false;
  }
  $scope.submitForm = function(model, ccinfo){
   
    if($scope.modeEdit && $scope.stepTwo){
      $scope.addPaymentProfileInPaya(model, ccinfo)
    }
    if($scope.stepOne){
      $scope.stepOne = false;
      $scope.stepTwo = true;
    }  
   
    if(!$scope.modeEdit ){
      $scope.initiateProfileWindow(model)
    }    
  }
  
    // Department Dropdown    
    $scope.selectedCustomerDepartment = {};
    $scope.isCustomerDepartmentAssigning = false;
    $scope.assignCustomerDepartment = function(department) {
        $scope.isProcessing = true;
        let payload = {
            customerId: $scope.customerId,
            departmentId: department.id
        }
        apiGateWay.send('/map_customer_location', payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.successMsg = response.data.message || "";
                setTimeout(function() {
                    $scope.successMsg = '';  
                }, 2000);
            } else {
                $scope.errorProductForm = response.data.message || "";
                setTimeout(function() {
                    $scope.errorProductForm = '';  
                }, 2000);
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.errorProductForm = typeof error == 'string' ? error : "Something went wrong!";
            setTimeout(function() {
                $scope.errorProductForm = '';  
            }, 2000);
            $scope.isProcessing = false;
        })  
    }
    $scope.setSelectedCustomerDepartment = function(department) {  
        if ($scope.selectedCustomerDepartment.id != department.id) {
            $scope.assignCustomerDepartment(department)
        }     
        $scope.selectedCustomerDepartment = department;
        return department.id || 0;
    } 
    // Department Dropdown
});
