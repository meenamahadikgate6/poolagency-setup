angular.module('POOLAGENCY')

.controller("companySignupController", ["$scope", "$rootScope", "$state", "auth", "apiGateWay", "$filter","config","$location", function($scope, $rootScope, $state, auth, apiGateWay, $filter,config,$location) {
  $scope.isProcessing = false;
  $scope.success = '';
  $scope.error = '';

  // get company details
  $scope.isProcessing = false;
  $scope.companyData = '';
  $scope.signupForm = {
      userInfo:{firstName: '', lastName: '',phoneNumber: '',email: '',companyName: '',address:'',city: '',state: '',zipcode: '',website: '',domain: '',companyPhoneNumber: '',password: ''},
      billInfo:{noOfTech: 0, firstName: '', lastName: '', phoneNumber: '',email: '',firstNameBill: '',lastNameBill: '',phoneNumberBill: '',emailBill: '',streetAddress: '',city: '',state: '',zipcode: ''},
      creditCard:{cardNo: '',expiry: ''}
  };


  var upadateCompany = function($sub_id,$customer_id){
    $scope.isProcessing = true;
    apiGateWay.send("/company/company_update", {sub_id: $sub_id,customer_id : $customer_id}).then(function(response) {
        if (response.data.status == 200) {
            $scope.success = response.data.message;
            var session = auth.getSession();
            $scope.currentStep = 3;
            $scope.resetProcess();
            session['roles'] = [{'key': 'companyadmin', 'value': 'Company Admin'}];
            session['companyStatus'] = 1;
            session['isCompanyHasFullSignUp'] = true;
            session['custId'] = $customer_id;
            session['editAlertPermission'] = 1;
            session['canEditReadings'] = 1;
            session['canDeleteJobs'] = 1; 
            session['viewTechnicianPay'] = 1;
            session['canCreateInvoice'] = 1;
            session['canEditInvoice'] = 1;
            session['canDeleteInvoice'] = 1;
            session['canCreateProducts'] = 1;
            session['canEditProducts'] = 1;
            session['canDeleteProducts'] = 1;
            session['canViewRouteProfitReport'] = 1;
            session['canDeleteNotes'] = 1;
            session['canViewCommission'] = 1;
            session['canEditCommission'] = 1;  
            session['canDismissAlerts'] = 1;  
            session['canBulkDismissAlerts'] = 1;  
            session['canDeletePayment'] = 1;  
            session['canExportCustomerReports'] = 1;
            session['canExportJobReports'] = 1;
            session['canExportQuoteReports'] = 1;
            session['canExportInvoiceReports'] = 1;
            session['canExportPaymentReports'] = 1;          
            session['canAccessMultiCompany'] = 1;         
            session['canManageAutomaticEmailSettings'] = 1;         
            session['canManageEmailTemplates'] = 1;
            session['canAccessTrucksAndToolsURL'] = 1;
            session['canAccessInventoryURL'] = 1;
            auth.setSession(session);
            var socketServer = config.currentEnvironment.socketServer;
            $scope.isProcessing = false;
              try{
                if(session && session.userId){
                    var userId = session.userId;
                    var socket = io.connect(socketServer + "?userId=" + userId, {transports:['websocket'], upgrade: false}, {'force new connection': true});
                    $rootScope.onlineServiceMangProcessing = true;
                    $rootScope.socket = socket;
                    socket.on("connect", function() {
                    });
                    socket.on("disconnect", function() {
                      $rootScope.scope = {};
                      // auth.destroySession();
                    });
                    socket.on("json", function(data) {
                    });
                    socket.on("message", function(data) {

                      var count = 0;
                      $rootScope.onlineServiceMang = [];
                      $rootScope.onlineServiceMang = Object.keys(data.users).map(
                        function(key) {
                          return data.users[key];
                        }
                      );
                      $rootScope.onlineServiceMangProcessing = false;
                      if (!$rootScope.$$phase) $rootScope.$apply();
                    });
                    socket.on("manager_response", function(data) {
                    });
                }
            }catch(error){
            }

        } else {
            $scope.error = response.data.message;
            $scope.isProcessing = false;
            $scope.resetProcess()
        }
      }, function(error){
       $scope.isProcessing = false;
       var msg = "Error";
       if (typeof error == "object" && error.data && error.data.message) {
         msg = error.data.message;
       } else {
         msg = error;
       }
       $scope.successMsg = "";
       $scope.error = msg;
       $scope.resetProcess()
    });
  }

  var queryParams = $location.search();
  if(queryParams['sub_id']){
      upadateCompany(queryParams['sub_id'],queryParams['customer_id']);
  }

  var getCompanyDetails = function(companyId){
    // get company details
    $scope.isProcessing = true;
    $scope.companyData = '';
    $scope.paymentHistory =[];
    apiGateWay.get("/administrator/company_details", {companyId: companyId}).then(function(response) {
        $scope.isProcessing = false;
        if(response.data.status == 200){
            var responseData = response.data.data;
            $scope.paymentHistory = responseData.paymentHistory;
            $scope.companyData = responseData.companyInfo;
            $scope.cardInfo = responseData.creditCard;
            responseData['userInfo'] = responseData.companyInfo;
            $scope.signupForm = responseData;
            if($scope.companyData.customer_id && $scope.companyData.subscription_id){
              // Land on dashboard
              //To avoid code redundancey using same logic with an unwanted api call
              upadateCompany($scope.companyData.subscription_id, $scope.companyData.customer_id); 
           }
        }
    },function(errorResponse){
        $scope.isProcessing = false;
    });
  };

  var loggedInRole = auth.loggedInRole();
  var session = auth.getSession();
  var authToken = session && session.token ? session.token : false;
  if(!authToken){
    authToken = auth.getStorage('authToken');
    if(!authToken){
        $rootScope.doLogout();
    }
  }

  var companyId = session.companyId;
  if(loggedInRole == 'companyadmin' && companyId){
      getCompanyDetails(companyId);
  }


  $scope.validateCardNumber = function(){
    $scope.signupForm['creditCard'].cardNo = $scope.signupForm['creditCard'].cardNo.replace(' ', '').replace('-', '');
  }




  var session = auth.getSession();
  if(session && Object.keys(session).length > 5){
        //$scope.signupForm.userInfo.firstName = session.firstName+' '+session.lastName;
        $scope.signupForm.userInfo.firstName = session.firstName;
        $scope.signupForm.userInfo.lastName = session.lastName;
        $scope.signupForm.userInfo.email = session.email;
        $scope.signupForm.userInfo.phoneNumber = session.phoneNumber;
  }


  $scope.stateList = [
    { value: 'Alabama' , key:'AL'},
    { value: 'Alaska' , key:'AK'},
    { value: 'Arizona' , key:'AZ'},
    { value: 'Arkansas' , key:'AR'},
    { value: 'California' , key:'CA'},
    { value: 'Colorado' , key:'CO'},
    { value: 'Connecticut' , key:'CT'},
    { value: 'Delaware' , key:'DE'},
    { value: 'Florida' , key:'FL'},
    { value: 'Georgia' , key:'GA'},
    { value: 'Hawaii' , key:'HI'},
    { value: 'Idaho' , key:'ID'},
    { value: 'Illinois' , key:'IL'},
    { value: 'Indiana' , key:'IN'},
    { value: 'Iowa' , key:'IA'},
    { value: 'Kansas' , key:'KS'},
    { value: 'Kentucky' , key:'KY'},
    { value: 'Louisiana' , key:'LA'},
    { value: 'Maine' , key:'ME'},
    { value: 'Maryland' , key:'MD'},
    { value: 'Massachusetts' , key:'MA'},
    { value: 'Michigan' , key:'MI'},
    { value: 'Minnesota' , key:'MN'},
    { value: 'Mississippi' , key:'MS'},
    { value: 'Missouri' , key:'MO'},
    { value: 'Montana' , key:'MT'},
    { value: 'Nebraska' , key:'NE'},
    { value: 'Nevada' , key:'NV'},
    { value: 'New Hampshire' , key:'NH'},
    { value: 'New Jersey' , key:'NJ'},
    { value: 'New Mexico' , key:'NM'},
    { value: 'New York' , key:'NY'},
    { value: 'North Carolina' , key:'NC'},
    { value: 'North Dakota' , key:'ND'},
    { value: 'Ohio' , key:'OH'},
    { value: 'Oklahoma' , key:'OK'},
    { value: 'Oregon' , key:'OR'},
    { value: 'Pennsylvania' , key:'PA'},
    { value: 'Rhode Island' , key:'RI'},
    { value: 'South Carolina' , key:'SC'},
    { value: 'South Dakota' , key:'SD'},
    { value: 'Tennessee' , key:'TN'},
    { value: 'Texas' , key:'TX'},
    { value: 'Utah' , key:'UT'},
    { value: 'Vermont' , key:'VT'},
    { value: 'Virginia' , key:'VA'},
    { value: 'Washington' , key:'WA'},
    { value: 'West Virginia' , key:'WV'},
    { value: 'Wisconsin' , key:'WI'},
    { value: 'Wyoming' , key:'WY'}

  ];
  $scope.expmonthList = [
      {key:'01',value:'January'},
      {key:'02',value:'February'},
      {key:'03',value:'March'},
      {key:'04',value:'April'},
      {key:'05',value:'May'},
      {key:'06',value:'June'},
      {key:'07',value:'July'},
      {key:'08',value:'August'},
      {key:'09',value:'September'},
      {key:'10',value:'October'},
      {key:'11',value:'November'},
      {key:'12',value:'December'},
  ];
  var currentDate = new Date();
  var currentYear = currentDate.getFullYear()
  $scope.expyearList = [];
  for(var i = 0; i < 20; i++){
    var fullYear = currentYear + i;
    var year = fullYear.toString().slice(-2);
    $scope.expyearList.push({key:year, value: fullYear})
  }

  // mention company signup steps
  $scope.totalSteps = [1,2,3];
  $scope.currentStep = 1;
  if(queryParams['sub_id']){
     $scope.currentStep = 3;
  }
  // previousStep to go back on previous company signup page
  $scope.previousStep = function(){
      if($scope.currentStep > 1){
          $scope.currentStep--;
      }else{
          $scope.currentStep = 1;
      }
  }
  // nextStep to continue on next company signup page
  $scope.nextStep = function(){
      if($scope.currentStep==1){
        checkAddressExist(function(isNotExist){
          if(isNotExist){
            stepChange();
          }
        });
      }else{
        stepChange();
      }
  }

  var checkAddressExist = function(callback){
      
      var userInfoModel = $scope.signupForm['userInfo'];
      var checkExistModel = {
        address: userInfoModel.address,
        city: userInfoModel.city,
        state: userInfoModel.state,
        zipcode: userInfoModel.zipcode,
        domain: userInfoModel.domain,
        companyName:userInfoModel.companyName,
        website:userInfoModel.website ? userInfoModel.website : ''
      };
      $scope.isProcessing = true;
      if(loggedInRole == 'companyadmin' && companyId){
        checkExistModel['companyId'] = companyId;
      }
      apiGateWay.get("/company/signup", checkExistModel).then(function(response) {
        if (response.data.status == 200) {
            if (response.data.data && response.data.data.companyId) {
                //getCompanyDetails(response.data.data.companyId);
                let session = auth.getSession();
                session['companyId'] = response.data.data.companyId;
                session['roles'] = [{'key': 'companyadmin', 'value': 'Company Admin'}];
                if (response.data.data.compLatLong && response.data.data.compLatLong != '' && response.data.data.compLatLong != ',') {
                  session['compLatLong'] = response.data.data.compLatLong
                }
                auth.setSession(session);
                $rootScope.userSession = auth.getSession();
            } 
            
        
          callback(true);
        }else{
          callback(false);
          $scope.successMsg = "";
          $scope.error = response.data.message;
        }
        $scope.resetProcess();
      }, function(error){
          var msg = "Error";
          if (typeof error == "object" && error.data && error.data.message) {
            msg = error.data.message;
          } else {
            msg = error;
          }
          $scope.successMsg = "";
          $scope.error = msg;
          callback(false);
          $scope.resetProcess();
      });
  }

  var stepChange = function(){
    if($scope.currentStep == 1){
          //$scope.submitFinal();
          $scope.openChargeBee();
      } 
      if($scope.currentStep < $scope.totalSteps.length){
          $scope.currentStep++;
      }else{
          $scope.currentStep = $scope.totalSteps.length;
      }
  }

  $scope.setSame = function(type,ischeck)
  {
      if(type=='billing'){
          if(ischeck == true){
              $scope.signupForm['billInfo'].firstNameBill = $scope.signupForm['billInfo'].firstName;
              $scope.signupForm['billInfo'].lastNameBill = $scope.signupForm['billInfo'].lastName;
              $scope.signupForm['billInfo'].emailBill = $scope.signupForm['billInfo'].email;
              $scope.signupForm['billInfo'].phoneNumberBill = $scope.signupForm['billInfo'].phoneNumber;
          }else{
              $scope.signupForm['billInfo'].firstNameBill = "";
              $scope.signupForm['billInfo'].lastNameBill = '';
              $scope.signupForm['billInfo'].emailBill = "";
              $scope.signupForm['billInfo'].phoneNumberBill = "";
          }
      }
      if(type=='primary'){
          if(ischeck == true)
              {
                  $scope.signupForm['billInfo'].firstName = $scope.signupForm['userInfo'].firstName;
                  $scope.signupForm['billInfo'].lastName = $scope.signupForm['userInfo'].lastName;
                  $scope.signupForm['billInfo'].email = $scope.signupForm['userInfo'].email;

              }else{
                  $scope.signupForm['billInfo'].firstName = "";
                  $scope.signupForm['billInfo'].email = "";
              }
      }
      if(type=='billaddress'){
          if(ischeck == true){
              $scope.signupForm['billInfo'].streetAddress = $scope.signupForm['userInfo'].address;
              $scope.signupForm['billInfo'].city = $scope.signupForm['userInfo'].city;
              $scope.signupForm['billInfo'].zipcode = $scope.signupForm['userInfo'].zipcode;
              $scope.signupForm['billInfo'].state = $scope.signupForm['userInfo'].state;

          }else{
              $scope.signupForm['billInfo'].streetAddress = "";
              $scope.signupForm['billInfo'].city = "";
              $scope.signupForm['billInfo'].zipcode = "";
              $scope.signupForm['billInfo'].state = "";
          }
      }
  }

  $scope.submitFinal = function() {
    $scope.isProcessing = true;
    $scope.success = '';
    $scope.error = '';
    var cardData ={};
    var secureData = {};
    var authData = {};
          // Extract the card number, expiration date, and card code.
          cardData['cardNumber'] = $scope.signupForm.creditCard.cardNo;
          cardData['month'] = $scope.signupForm.creditCard.expMonth;
          cardData['year'] = $scope.signupForm.creditCard.expYear;
          cardData['cardCode'] = $scope.signupForm.creditCard.cvv;
          cardData['nameOnCard'] = $scope.signupForm.billInfo.firstNameBill;
          secureData['cardData'] = cardData;
          secureData['ts'] = new Date().getTime();
          // The Authorize.Net Client Key is used in place of the traditional Transaction Key. The Transaction Key
          // is a shared secret and must never be exposed. The Client Key is a public key suitable for use where
          // someone outside the merchant might see it.
          authData['clientKey'] = config.currentEnvironment['authorizeClientKey'];
          authData['apiLoginID'] = config.currentEnvironment['authorizeApiLoginId'];
          secureData['authData'] = authData;
          var _self = this;
          // Pass the card number and expiration date to Accept.js for submission to Authorize.Net.

          Accept.dispatchData(secureData, function(response) {
              if (response.messages.resultCode === "Error") {
                  var errors = "";
                  var code = "";
                  for (var i = 0; i < response.messages.message.length; i++) {
                      errors = response.messages.message[i].text;
                      code= response.messages.message[i].code;
                  }
                  if (code != "E_WC_14")
                  {
                      if(code == 'E_WC_03')
                      {
                          errors = "Some issue occurred from the payment server.Please reload the page and try again.";
                      }
                  }
                  $scope.error = errors
                  $scope.isProcessing = false;
                  $scope.resetProcess()
              } else {
                  $scope.error = "";
                  // $scope.signupForm.creditCard = {};
                  if(response['opaqueData'])
                  {
                      $scope.signupForm.creditCard.dataDescriptor = response['opaqueData']['dataDescriptor'];
                      $scope.signupForm.creditCard.dataValue = response['opaqueData']['dataValue'];
                      $scope.makePayment();
                  }
              }
          });
  }

  $scope.makePayment = function()
  {
    var endPoint = '/company/signup';
    if(loggedInRole == 'companyadmin'){
      endPoint = '/company/signup_from_admin';
    }
    apiGateWay.send(endPoint, $scope.signupForm).then(function(response) {
        if (response.data.status == 201) {
            $scope.success = response.data.message;


            $scope.isProcessing = false;
            var session = auth.getSession();
            $scope.currentStep = 3;
            $scope.resetProcess();
            session['roles'] = [{'key': 'companyadmin', 'value': 'Company Admin'}];
            session['isCompanyHasFullSignUp'] = true;
            auth.setSession(session);
            var socketServer = config.currentEnvironment.socketServer;

              try{
                if(session && session.userId){
                    var userId = session.userId;
                    var socket = io.connect(socketServer + "?userId=" + userId, {transports:['websocket'], upgrade: false}, {'force new connection': true});
                    $rootScope.onlineServiceMangProcessing = true;
                    $rootScope.socket = socket;
                    socket.on("connect", function() {
                    });
                    socket.on("disconnect", function() {
                      $rootScope.scope = {};
                      // auth.destroySession();
                    });
                    socket.on("json", function(data) {
                    });
                    socket.on("message", function(data) {

                      var count = 0;
                      $rootScope.onlineServiceMang = [];
                      $rootScope.onlineServiceMang = Object.keys(data.users).map(
                        function(key) {
                          return data.users[key];
                        }
                      );
                      $rootScope.onlineServiceMangProcessing = false;
                      if (!$rootScope.$$phase) $rootScope.$apply();
                    });
                    socket.on("manager_response", function(data) {
                    });
                }
            }catch(error){
            }

            // setTimeout(function(){
            //     $state.go('app.customer', {}, {reload: true});
            // }, 1000);


        } else {
            $scope.error = response.data.message;
            $scope.isProcessing = false;
            $scope.resetProcess()
        }
    }, function(error){
       $scope.isProcessing = false;
       var msg = "Error";
       if (typeof error == "object" && error.data && error.data.message) {
         msg = error.data.message;
       } else {
         msg = error;
       }
       $scope.successMsg = "";
       $scope.error = msg;
       $scope.resetProcess()
    });
  }

  $scope.toContinue = function(){
      $state.go('app.customer', {}, {reload: true});
  }

  $scope.openChargeBee = function(){
    //[Rajendra] : Check company subscription exists
    //If yes, redirect on dasboard
    //if no open checkout
    $scope.isProcessing = true;
    var session = auth.getSession();
    var companyId = session.companyId;
    apiGateWay.get("/administrator/company_details", {companyId: companyId}).then(function(response) {
        $scope.isProcessing = false;
        if(response.data.status == 200){
            var responseData = response.data.data;
            var companyData = responseData.companyInfo;
            if(companyData.customer_id && companyData.subscription_id){
               // Land on dashboard
               //To avoid code redundancey using same logic with an unwanted api call
               upadateCompany(companyData.subscription_id, companyData.customer_id); 
            }else{
              $scope.clickChargeBeeLink();
            }
        }
    },function(errorResponse){
        $scope.isProcessing = false;
        $scope.clickChargeBeeLink();
    });
  }

  $scope.clickChargeBeeLink = function(){
    var link = document.querySelectorAll("[data-cb-type=checkout]")[0];
    var cbInstance = window.Chargebee.getInstance();
    var product = cbInstance.getProduct(link);
    let session = auth.getSession();
    let companyid = session.companyId;
    product.data["cf_company_id"] = companyid;
    product.data["cf_company"] = companyid;
    var alink = document.getElementById('chargebee-plan');
    alink.click();
}
  
  $scope.resetProcess = function() {
    setTimeout(function() {
      $scope.success = false;
      $scope.error = false;
      if (!$scope.$$phase) $scope.$apply();
    }, 2000);
    $scope.isProcessing = false;
  };


}]);
