angular.module('POOLAGENCY')

.controller('serviceScheduleController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams, $timeout, auth, $window, configConstant,$filter) {
    var userSession = auth.getSession()
    $scope.companyId = userSession.companyId;
    $scope.userId = userSession.userId;
    $scope.userCanDeleteInvoice = (userSession.userType == "administrator" ? 1 : (userSession.canDeleteInvoice ? userSession.canDeleteInvoice : 0));
    $scope.userCanCreateInvoice = (userSession.userType == "administrator" ? 1 : (userSession.canCreateInvoice ? userSession.canCreateInvoice : 0));
    $scope.addressId = $stateParams.addressId;
    $scope.scheduler = [];
    $scope.crossClicked = false;   
    $scope.isApiProcessing = false;
    $scope.daysSelected = false;
    $scope.model = {
        "days":'',
        "weekFrequency": '1',
        "weekFrequencyValue": 0,
        "endDateInput":'1',
        "endDate":'',
        "notes": '',
        "status": 0,
        "addressRouteDetails": []
    }; 
    $scope.serviceLevelArray = [];
    $scope.assignedSL = {};
    $scope.assignedPT = {};
    $scope.selectedServiceLevelOption = 0;
    $scope.waterBodyBilling = [];
    $scope.waterBodyBillingModel = [];
    $scope.modelBillingSettingObj = {
        "custBillingDefault": {},
        "discountData": [], 
        "activateBilling": false, 
        "companyId":  $scope.companyId, 
        "customersPay": "Monthly Flat Rate", 
        "invoiceNotes": "We appreciate your business and prompt payment", 
        "invoicedOn": "First of Month", 
        "isAutoCharge": true, 
        "isAutoEmailInvoice": true, 
        "isReattemptCharge": true,  
        "reattemptDays": 14, 
        "terms": "Due Immediately",
        "serviceLevel": [],
        "customerPaymentProfileId" : '',
        "paymentProfileObj": {id:null}
    };

    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createTime';

    $scope.billingSettingObj = angular.copy($scope.modelBillingSettingObj)
    $scope.isFormDirty = false;
    $scope.routeToggleModified = false; 
    /*check status*/
    
    window.onbeforeunload = function (e) {
        if($scope.modelBillingSettingObj.isAutoCharge && !$scope.modelBillingSettingObj.customerPaymentProfileId && $scope.model.status && $scope.modelBillingSettingObj.activateBilling){  
            return false;      
        }        
     };
    
    /*get scheduler Details*/
    $scope.sortDays = function(days, timezone){
        var dayOfWeek = 7;
        var list = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        var sortedList = list.slice(dayOfWeek).concat(list.slice(0, dayOfWeek));
        return days.sort((a, b) => {
          if (sortedList.indexOf(a.day) > sortedList.indexOf(b.day)) return 1;
          if (sortedList.indexOf(a.day) < sortedList.indexOf(b.day)) return -1;
          return 0;
        });
    };

    $rootScope.getSchedulerDetails = function() {         
        $scope.scheduler = {
            notes: $rootScope.custAddrSchData.notes,
            weekFrequency: $rootScope.custAddrSchData.weekFrequency ? $rootScope.custAddrSchData.weekFrequency : '1',
            weekFrequencyValue: $rootScope.custAddrSchData.weekFrequency && $rootScope.custAddrSchData.weekFrequency > 2 ? $rootScope.custAddrSchData.weekFrequency : 0,
            endDateInput: $rootScope.custAddrSchData.endDate ? '2' : '1',
            endDate : $rootScope.custAddrSchData.endDate ? $rootScope.custAddrSchData.endDate : '',
            days: $rootScope.custAddrSchData.days,
            status: $rootScope.custAddrSchData.status ? $rootScope.custAddrSchData.status : 0,
            addressRouteDetails: $rootScope.custAddrSchData.addressRouteDetails ? $scope.sortDays($rootScope.custAddrSchData.addressRouteDetails) : [],
        }           
              
        
        $scope.weekDays = [
            {label:'MON',status:false,slug:'M'},
            {label:'TUE',status:false,slug:'T'},
            {label:'WED',status:false,slug:'W'},
            {label:'THU',status:false,slug:'U'},
            {label:'FRI',status:false,slug:'F'},
            {label:'SAT',status:false,slug:'S'},
            {label:'SUN',status:false,slug:'N'},           
        ]
        $scope.daysSelected = false;
        $scope.showWeekDays = false
        if($scope.scheduler.days){
            angular.forEach($scope.weekDays, function(item, index) {
                if($scope.scheduler.days.indexOf(item.slug) > -1){
                    $scope.weekDays[index].status = true;
                    $scope.daysSelected = true;                    
                }          
            });
        }
    };  
    
    $scope.toggleDaysSelection = function(){
        if(!$scope.daysSelected){
            $scope.showWeekDays=!$scope.showWeekDays;
        }
    }
    /*Show scheduler Detail*/      
    $scope.showSchedulerDetail = function() {  
        $scope.getAddressBillingSettings();
        $scope.getBillingWaterBody();
        $scope.getInvoiceDayCreation();
        $scope.updateCustAddrSchData();
        $scope.singlePopup = true;        
        $scope.model = {
            "days": $scope.scheduler.days,
            "weekFrequency": $scope.scheduler.weekFrequency,
            "weekFrequencyValue": $scope.scheduler.weekFrequency > 2 ? $scope.scheduler.weekFrequency : 0,
            "endDateInput": $scope.scheduler.endDateInput,
            "notes": $scope.scheduler.notes,
            "status": $scope.scheduler.status,
            "addressRouteDetails": $scope.scheduler.addressRouteDetails
        };
        if($scope.model.weekFrequency>2){
            $scope.showCustomValue($scope.model);
        }
        
        if(!$scope.scheduler.status){           
            $scope.model.addressRouteDetails = [];
        }
        ngDialog.open({
            id  : 10,
            template: 'schedulerDetails.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            name :'schedulerDetails',
            // closeByNavigation: true, 
            scope: $scope,
            preCloseCallback: function() {  
                $scope.deactivateType = 'close';
                $rootScope.actionPerformed = 'route_schedule_status_changed';
                $scope.saveSchedulerDetail($scope.model, '', 'close'); 
                $scope.isDeactivateTypeCalledFromBtn = false;                
                if($scope.modelBillingSettingObj.isAutoCharge && !$scope.modelBillingSettingObj.customerPaymentProfileId && $scope.model.status && $scope.modelBillingSettingObj.activateBilling){                    
                    $scope.confirmClose = ngDialog.open({
                        template: 'confirmClose.html',
                        className: 'ngdialog-theme-default v-center',       
                        closeByNavigation: false,
                        scope: $scope,
                        preCloseCallback: function () {         
                            //$scope.obj = '';                           
                        }
                    });
                    return false;  
                } else {
                    if($scope.isFormDirty){
                        $timeout(function(){                       
                            $scope.model = {};     
                            $rootScope.refreshCustomer();                          
                        }, 100) 
                    }
                    return true; 
                }                
            }
        });
    };  


    $rootScope.$on('ngDialog.opened', function (e, $dialog) {     
           
        if($dialog.name == 'schedulerDetails' && $scope.singlePopup){
            $scope.singlePopup = false;
            $('.datepicker-custom-input').datepicker({
                startDate: new Date(),
                autoclose: true,
                todayBtn: "linked",
                format: 'mm/dd/yyyy',
                autoclose: true,
            });            
            if($scope.scheduler.endDate){
                $('.datepicker-custom-input').datepicker('update', new Date(moment($scope.scheduler.endDate)));         
            }
        }        
      });
    $scope.chooseDate = function(model){
        $scope.model.endDateInput = '2';
        $scope.saveSchedulerDetail(model)
    }

    $scope.focusOnweekFrequencyValueInput = () => {
        $scope.model.weekFrequencyValue = 0;
        setTimeout(function(){
            var weekFrequencyValueInput = document.getElementById('form-control-x-week');
            if (weekFrequencyValueInput) {
                weekFrequencyValueInput.focus();
            }
        }, 250)
    }
    $scope.showCustomValue = function(model){
        if($scope.model.weekFrequency !== 'custom'){
            $scope.model.weekFrequencyValue = $scope.model.weekFrequency
            $scope.model.weekFrequency = 'custom'
        }
    }

    $scope.saveSchedulerDetail = function(model, custom=null, close=null){
        if (custom == 'custom') {
            var weekFrequencyValueInput = document.getElementById('form-control-x-week');
            if (weekFrequencyValueInput) {
                weekFrequencyValueInput.classList.remove('has-error');        
            }            
            if (isNaN(model.weekFrequencyValue) || model.weekFrequencyValue === '0' || model.weekFrequencyValue === 0 || model.weekFrequencyValue === '') {
                model.weekFrequencyValue = 0
                if (weekFrequencyValueInput) {
                    weekFrequencyValueInput.classList.add('has-error');
                }
            }
            if (model.weekFrequencyValue && model.weekFrequencyValue != '') {
                model.weekFrequencyValue = Number(model.weekFrequencyValue);
            }
            if (model.weekFrequencyValue > 52) {
                weekFrequencyValueInput.classList.add('has-error');
            }
            if (model.weekFrequencyValue == 1 || model.weekFrequencyValue == 2) {
                model.weekFrequency = '' + model.weekFrequencyValue
            }
        }
        var postData = angular.copy(model);  
        if(model.endDate && model.endDateInput == 2){           
            //postData.endDate = moment.utc(model.endDate).format('YYYY-MM-DD hh:mm:ss');
            var date = angular.copy(new Date(model.endDate+' 12:00:00'));
            postData.endDate = moment.utc(date).format('YYYY-MM-DD hh:mm:ss');
        } else {
            postData.endDate = null;
        }     

        var days = [];
        angular.forEach($scope.weekDays, function(item, index) {
            if(item.status){
                days.push(item.slug);
            }          
        });
        postData.days = days.toString(); 
        postData.dayName = $rootScope.dayName; 

        if(model.status){
            postData.status = 1;
        } else {
            model.status = 0;
        }

        if(custom == 'custom' && (postData.weekFrequencyValue == undefined || postData.weekFrequency == undefined || postData.weekFrequencyValue == '')){
            return false
        }
        if(custom == 'custom' && postData.weekFrequencyValue != ''){
            if(postData.weekFrequencyValue < 1 || postData.weekFrequencyValue > 52){
                return false
            }
            postData.weekFrequency = postData.weekFrequencyValue
        }
        if(postData.weekFrequencyValue > 2 && postData.weekFrequency == "custom") {
            postData.weekFrequency = postData.weekFrequencyValue
        }
        $scope.isProcessing = true;
        postData.addressId = $scope.addressId;
        postData.actionPerformed = $rootScope.actionPerformed ? $rootScope.actionPerformed : '';
        postData.deactivateType = $scope.deactivateType;     
        postData.isDeactivateTypeCalledFromBtn = angular.copy($scope.isDeactivateTypeCalledFromBtn);          
        if(!close){
            $scope.isFormDirty = true;
        }   
        postData.routeToggleModified = $scope.routeToggleModified; 
        apiGateWay.send("/manage_add_schedule", postData).then(function(response) {  
            if (response.data.status == 200) {
                $scope.sendToSocket(postData);
                $scope.model.status = $rootScope.custAddrSchData.status = response.data.data.status;
                if (response.data.data.status && $scope.routeToggleModified) {
                    $scope.modelBillingSettingObj.isServiceDatesHidden = $scope.isRouteServiceDatesHidden = $scope.modelBillingSettingObj.isServiceDatesHidden ? true : false;
                    $scope.updateBillingSettings('isServiceDatesHidden', 'route_schedule_status_changed');
                }
                if (response.data.data.billingData) {
                    $scope.modelBillingSettingObj.customersPay = response.data.data.billingData.customersPay;
                    $scope.modelBillingSettingObj.isAutoCharge = response.data.data.billingData.isAutoCharge;
                    $scope.modelBillingSettingObj.isAutoEmailInvoice = response.data.data.billingData.isAutoEmailInvoice;
                    $scope.modelBillingSettingObj.invoicedOn = response.data.data.billingData.invoicedOn;
                }
                //$scope.successMsg = response.data.message; 
                /*$rootScope.custAddrSchData = postData;
                $scope.scheduler = angular.copy($scope.model);
                if(!model.status){
                    $scope.scheduler = angular.copy($scope.model);
                    $rootScope.custAddrSchData.addressRouteDetails = $scope.scheduler.addressRouteDetails = [];
                    $rootScope.custAddrSchData.notes = $scope.scheduler.notes = '';
                    $rootScope.custAddrSchData.endDate = $scope.scheduler.endDate = '';
                    $rootScope.custAddrSchData.weekFrequency = $scope.scheduler.weekFrequency = '1';
                }*/
                if($scope.deactivateType == 'create' || $scope.deactivateType == 'delete'){
                    ngDialog.closeAll();
                }
                $scope.deactivateType = null;
                $rootScope.actionPerformed = null;
                $scope.changeStatus();
                $scope.getInvoiceDayCreation();
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {                
                $scope.error = '';
                $scope.successMsg = '';                    
                //ngDialog.closeAll();
                if (!$scope.$$phase) $scope.$apply()                
            }, 2000);
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            $scope.isApiProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });  
      }

      $scope.changeStatus = function () {
        $scope.isChangingStatus = true;
        apiGateWay.get("/customer/change_status", {'addressId': $scope.addressId }).then(function(response) {
          if (response.status == 200) {
            $scope.isChangingStatus = false;
          }else{
            $scope.isChangingStatusError = response.message;
        }
        $scope.isChangingStatus = false;
      }, function(error) {
        $scope.isChangingStatusError = error;
        $scope.isChangingStatus = false;
        });
      }

      $scope.selectDay = function(index, model){
        $scope.weekDays[index].status = angular.copy(!$scope.weekDays[index].status) 
        $scope.saveSchedulerDetail(model);
      }
    $scope.eraseDataConfirm = function() {
        ngDialog.open({
          template: 'eraseDataConfirm.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
   
    $scope.confirmInvoiceCreation = function() {
        ngDialog.open({
          template: 'confirmInvoiceCreation.html',
          className: 'ngdialog-theme-default v-center',
          overlay: true,
          closeByNavigation: true,
          scope: $scope,  
          preCloseCallback: function() {
            if(!$scope.deactivateType){
                $scope.deactivateType = 'cancel';
                $scope.saveSchedulerDetail($scope.model);                
            }
          }
        });     
    };
  
    $scope.eraseData = function(){
        var postData = {            
            "addressId":$scope.addressId,
            "data": $scope.model.slug,
            "value":''
        }
        $scope.isProcessing = true;
        $scope.isFormDirty = true;
        apiGateWay.send("/manage_add_details", postData).then(function(response) {  
            if (response.data.status == 200) {
                $scope.successMsg = response.data.message; 
                $rootScope.custAddrDetailsData[response.data.data.data]  =  response.data.data.value; 
                $scope.getSchedulerDetails();                
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isApiProcessing = false;
            setTimeout(function() {                
                //$scope.selectedScheduler =  $scope.scheduler.filter(eitem => eitem.eqId == schedulerSlug); 
                $scope.error = '';
                $scope.successMsg = '';              
                $scope.isProcessing = false;                
                 ngDialog.closeAll();
                if (!$scope.$$phase) $scope.$apply()                
            }, 1000);
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            $scope.isApiProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 1000);
        });
    }
    //get Billing Setting
    $scope.getAddressBillingSettings = function(){
        $scope.selectedCustomerPayServiceLevelIndex = 0;
        $scope.isProcessing = true;
        apiGateWay.get("/company_billing_settings", {addressId:$scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                if(response.data.data){
                    if(response.data.data.custBillingDefault){
                        $scope.modelBillingSettingObj = angular.copy(response.data.data.custBillingDefault);               
                        $scope.modelBillingSettingObj.activateBilling = angular.copy(response.data.data.activateBilling)                    
                        $scope.modelBillingSettingObj.paymentProfileObj = {};
                        $scope.modelBillingSettingObj.paymentProfileObj.id =  $scope.modelBillingSettingObj.customerPaymentProfileId ? $scope.modelBillingSettingObj.customerPaymentProfileId : null;
                        $rootScope.watchPaymentMethodId = angular.copy($scope.modelBillingSettingObj.customerPaymentProfileId);
                    } else {
                        $scope.modelBillingSettingObj = angular.copy(response.data.data)
                        $scope.modelBillingSettingObj.customerPaymentProfileId = null;
                        $scope.modelBillingSettingObj.paymentProfileObj = {};
                        $scope.modelBillingSettingObj.paymentProfileObj.id = null;
                        $scope.modelBillingSettingObj.paymentProfileObj.paymentProfileName = null;
                    }
                    $scope.modelBillingSettingObj.customerId = angular.copy(response.data.data.customerId);
                    $scope.billingSettingObj = angular.copy($scope.modelBillingSettingObj)
                    $scope.modelBillingSettingObj.discountData = angular.copy(response.data.data.discountData)

                    if(response.data.data.custBillingDefault && (response.data.data.custBillingDefault.discountNumber > 0 || response.data.data.custBillingDefault.discountNumber == null)){
                        $scope.modelBillingSettingObj.discountData = angular.copy(response.data.data.discountData)
                        $scope.modelBillingSettingObj.discountData.unshift({id: null, title: "None"});
                        let discountTitle = $scope.modelBillingSettingObj.discountData.filter(function(i){ return i.id == $scope.modelBillingSettingObj.discountId})
                        $scope.modelBillingSettingObj.discountTitle = discountTitle.length > 0 ? discountTitle[0].title : "None";
                    } else {
                        $scope.modelBillingSettingObj.discountId = null;
                        $scope.modelBillingSettingObj.discountTitle = "None";
                        $scope.modelBillingSettingObj.discountData.unshift({id: null, title: "None"});
                    }
                    $scope.getPaymentProfile()
                    //$scope.updateDiscountArray(response.data.data.discountData);
                    //$scope.getServiceLevelPay();
                    $scope.modelBillingSettingObj.isServiceDatesHidden = response.data.data.isServiceDatesHidden;
                }
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.isProcessing = false;
        })
    }  
    //updated billing setting top section
    $scope.updateBillingSettings = function(node='',actionPerformed){

        if(node && node != "discountId" && $scope.modelBillingSettingObj[node] == $scope.billingSettingObj[node] || (!$scope.modelBillingSettingObj[node] && !$scope.billingSettingObj[node])){return false;}
        if(node == 'isAutoCharge' && $scope.modelBillingSettingObj[node] != $scope.billingSettingObj[node] && $scope.modelBillingSettingObj[node] == false){
            $scope.modelBillingSettingObj.customerPaymentProfileId = 0
            $scope.modelBillingSettingObj.paymentProfileObj = {};
            $scope.modelBillingSettingObj.paymentProfileObj.id = null;
            $scope.modelBillingSettingObj.paymentProfileObj.paymentProfileName = null;
        }

        let postData = {
            "companyId":$scope.modelBillingSettingObj.companyId,
            "customersPay":$scope.modelBillingSettingObj.customersPay,
            "invoicedOn":$scope.modelBillingSettingObj.invoicedOn,
            "isAutoCharge":$scope.modelBillingSettingObj.isAutoCharge,
            "isAutoEmailInvoice":$scope.modelBillingSettingObj.isAutoEmailInvoice,
            "isReattemptCharge":$scope.modelBillingSettingObj.isReattemptCharge,
            "reattemptDays":$scope.modelBillingSettingObj.reattemptDays,
            "addressId":$scope.addressId,
            "discountId":$scope.modelBillingSettingObj.discountId,
            "customerPaymentProfileId":$scope.modelBillingSettingObj.customerPaymentProfileId,
            "isDiscountUpdated": (node == "discountId") ? true : false,
            "actionPerformed": actionPerformed,
            "discount_change_value": $scope.modelBillingSettingObj.discountTitle, 
            "auto_charge_select_payment_value": $scope.modelBillingSettingObj.paymentProfileObj.paymentProfileName,
            "isServiceDatesHidden": $scope.modelBillingSettingObj.isServiceDatesHidden
        }

        $scope.isProcessing = true;
        $scope.isFormDirty = true;
        apiGateWay.send("/customer_billing_settings", postData).then(function(response) {
            if (response.data.status == 200) { 
                $scope.billingSettingObj[node] = angular.copy($scope.modelBillingSettingObj[node])
                if($scope.modelBillingSettingObj.customerPaymentProfileId && $scope.modelBillingSettingObj.isAutoCharge){
                    $rootScope.watchPaymentMethodId = angular.copy($scope.modelBillingSettingObj.customerPaymentProfileId);
                } else {
                    $rootScope.watchPaymentMethodId = '';
                }
                if(node == 'invoicedOn'){
                    $scope.getBillingWaterBody();
                }
                $scope.modelBillingSettingObj.discountNumber = response.data.data.discountNumber
                //$scope.addDiscount(response.data.message);   
                //$scope.successMsg = response.data.message;
            } else {       
                $scope.errorMsg = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function(){
            $scope.successMsg = '';
            $scope.errorMsg = '';   
            }, 2000)

        }, function(error){
            $scope.error = error
            $scope.modelBillingSettingObj[node] = angular.copy($scope.billingSettingObj[node])
            setTimeout(function(){
                $scope.error = '';   
            }, 2000)
            $scope.isProcessing = false;
        })
    }   
     //toggle Switch
    $scope.toggleSwitch = function(node,action){
        $scope.modelBillingSettingObj[node] = angular.copy(!$scope.modelBillingSettingObj[node]);
        $scope.updateBillingSettings(node,action);
    }
    // Billing schedule
    $scope.getBillingWaterBody = function(id){
    $scope.isProcessing = true;
    apiGateWay.get('/route_billing_schedule', {addressId: $scope.addressId}).then(function(response) {
        if(response.data.status == 200){
            $scope.waterBodyBilling = response.data.data;            
            apiGateWay.get('/service_level_pool_type_list', {addressId: $scope.addressId}).then(function(response) {
                if(response.data.status == 200){                   
                    let _sLevels = $rootScope.sortServiceLevel(response.data.data.serviceLevels, 'techPay');
                    // set default '--' to top
                    _sLevels.forEach(function(item,i){
                        if(item.title === "--"){
                          _sLevels.splice(i, 1);
                          _sLevels.unshift(item);
                        }
                    });
                    // set default '--'to top
                    $scope.serviceLevelArray = angular.copy(_sLevels)
                    var _sLevelIndex = 0;
                    angular.forEach($scope.serviceLevelArray, function(item){
                        $scope.serviceLevelArray[_sLevelIndex].poolTypes = $scope.serviceLevelArray[_sLevelIndex].poolTypes || [];
                        $scope.serviceLevelArray[_sLevelIndex].poolTypes.sort(function(a, b){
                            if(a.poolType.toLowerCase() < b.poolType.toLowerCase()) { return -1; }
                            if(a.poolType.toLowerCase() > b.poolType.toLowerCase()) { return 1; }
                            return 0;
                        })
                        _sLevelIndex++;
                    })     
                        
                    angular.forEach( $scope.serviceLevelArray, function(item, index){
                        if(index != 0){
                            $scope.serviceLevelArray[index].poolTypes.unshift({id: 0, poolType: "--"});
                        }
                    })                        
                    angular.forEach($scope.waterBodyBilling, function(item, index){
                        $scope.waterBodyBilling[index].selectedServiceLevelIndex = 0;
                        $scope.waterBodyBilling[index].isChargeForChemicals = angular.copy($scope.waterBodyBilling[index].isChargeForChemicals == null ? false :$scope.waterBodyBilling[index].isChargeForChemicals);
                        $scope.waterBodyBilling[index].rate = angular.copy($scope.waterBodyBilling[index].rate ? $scope.waterBodyBilling[index].rate : 0);
                        let _tempServLevels =  angular.copy($scope.serviceLevelArray);
                        let _tempServLevels2 =  _tempServLevels.filter((item) => item.title !== '--');
                        let result  = _tempServLevels2.filter(function(item, childIndex){                             
                            if(item.serviceLevelId == $scope.waterBodyBilling[index].serviceLevelId){
                                if (_tempServLevels.length === _tempServLevels2.length) {
                                    $scope.waterBodyBilling[index].selectedServiceLevelIndex = childIndex;
                                } else {
                                    $scope.waterBodyBilling[index].selectedServiceLevelIndex = childIndex + 1;
                                }
                            }                           
                            return item.serviceLevelId == $scope.waterBodyBilling[index].serviceLevelId 
                        })
                        if (item.custDefaultServiceLevel === 1) {
                            result = []
                        }
                        $scope.waterBodyBilling[index].serviceLevelTitle = result.length > 0 ? result[0].title : '--';        
                        $scope.waterBodyBilling[index].serviceLevelId = result.length > 0 ? result[0].serviceLevelId : 0;                           
                        //check pooltype
                        if(result.length > 0){
                            angular.forEach(result, function(item, childIndex){
                                let poolResult  = item.poolTypes.filter(function(item){ return item.id == $scope.waterBodyBilling[index].poolTypeId })
                             
                                $scope.waterBodyBilling[index].poolType = poolResult.length > 0 ? poolResult[0].poolType : '--';        
                                $scope.waterBodyBilling[index].poolTypeId = poolResult.length > 0 ? poolResult[0].id : 0;  
                            }) 
                        }
                        
                               
                    })                   
                    $scope.waterBodyBillingModel = angular.copy($scope.waterBodyBilling);
                }           
                $scope.isProcessing = false;
            }, function(error){
                $scope.isProcessing = false;                
            })   
        } else {
            $scope.isProcessing = false;
        }                  
      }, function(error){
          $scope.isProcessing = false;
          
      })
    }
    $scope.assignServiceLevel = function(action, id, title, waterBodyId, index, parentIndex, waterBodyName, serviceLevelCheck = 0){
        $scope.isProcessing = true;
        if (title==='--') {
            serviceLevelCheck = 1 
        } 
        var serviceLevelData = {serviceLevelCheck:serviceLevelCheck, "id":id, "addressId":$scope.addressId, waterBodyId: waterBodyId,"billing_schedule_name": waterBodyName, "billing_schedule_service_level": title,
    "actionPerformed": action}
        $scope.isFormDirty = true;
        apiGateWay.send("/assign_servicelevel", serviceLevelData).then(function(response) {
            if (response.data.status == 200) {                
                $scope.waterBodyBilling[parentIndex].serviceLevelId = id;
                $scope.waterBodyBilling[parentIndex].serviceLevelTitle = title;       
                $scope.successMsg = response.data.message;    
                $scope.waterBodyBilling[parentIndex].poolTypeId = 0;
                $scope.waterBodyBilling[parentIndex].poolType = '--'; 
                $scope.waterBodyBilling[parentIndex].selectedServiceLevelIndex = index; 
                $scope.waterBodyBilling[parentIndex].rate = null;  
                $scope.waterBodyBillingModel = angular.copy($scope.waterBodyBilling);
                //$scope.assignedPT = {id:0, poolType:'--', status:1}

            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {

            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
    }
    $scope.assignPoolType = function(action, id, title, waterBodyId, index, parentIndex, waterBodyName){
        $scope.isProcessing = true;
        let postData = {"poolTypeId":id, serviceLevelId:  $scope.waterBodyBillingModel[parentIndex].serviceLevelId, addressId:$scope.addressId, waterBodyId: waterBodyId,"billing_schedule_type": title, "billing_schedule_name": waterBodyName,"actionPerformed": action, isRouteModalOpen: true}
        $scope.isFormDirty = true;
        apiGateWay.send("/assign_pool_type", postData).then(function(response) {
            if (response.data.status == 200) {
                //$scope.waterBodyBilling[parentIndex].poolTypeId = id;
                //$scope.waterBodyBilling[parentIndex].poolType = title;  
                //$scope.waterBodyBilling[parentIndex].rate = null;
                //$scope.waterBodyBillingModel = angular.copy($scope.waterBodyBilling); 
                $scope.getBillingWaterBody();    
                $scope.successMsg = response.data.message;
                
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {

            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
    }
    //toggle Switch
    $scope.toggleCharge = function(index, node, action){
        $scope.waterBodyBillingModel[index][node] = angular.copy(!$scope.waterBodyBillingModel[index][node]);
        $scope.updateServiceLevelPay({index: index, type: node, action: action});
    }
    $scope.lockPrice = function(index, isLocked){

        let postData = {
            "waterBodyId": $scope.waterBodyBillingModel[index].waterBodyId ? $scope.waterBodyBillingModel[index].waterBodyId : 0,
            "addressId":$scope.addressId,
            "rate": $scope.waterBodyBillingModel[index].rate,
            "isLocked": isLocked ? false : true,
            "actionPerformed": 'billing_price_lock',
            'billing_schedule_name': $scope.waterBodyBillingModel[index].waterBodyName
        }
        $scope.isProcessing = true;

        apiGateWay.send("/customer_pay_lock?companyId="+$scope.companyId, postData).then(function(response) {
            if(response.data.status == 200 && response.data.data) {
                $scope.waterBodyBillingModel[index].isLocked = isLocked ? false : true
            } else{
                $scope.errorMsg = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function(){
                $scope.successMsg = '';
                $scope.errorMsg = '';
            }, 2000)
        })

    }
    $scope.changePriceOfUpcomingInvoicePopup = null;
    $scope.changePriceOfUpcomingInvoicePopupIndex = null;
    $scope.openChangePriceOfUpcomingInvoicePopup = function(index) {
        if($scope.waterBodyBillingModel[index].rate == $scope.waterBodyBilling[index].rate) {
            return false;
        }
        $scope.changePriceOfUpcomingInvoicePopupIndex = index;
        $scope.changePriceOfUpcomingInvoicePopup = ngDialog.open({
            template: 'changePriceOfUpcomingInvoice.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: false,
            closeByDocument: false,
            closeByEscape: false,
            scope: $scope,  
            preCloseCallback: function(closedBy) {               
            }
          }); 
    }
    $scope.changePriceOfUpcomingInvAction = function(method) {
        if (method == 'rightNow') {
            $scope.updateServiceLevelPay({ index: $scope.changePriceOfUpcomingInvoicePopupIndex, changePriceOfUpcomingInvoice:'rightNow'});
            $scope.changePriceOfUpcomingInvoicePopup.close();
        }
        if (method == 'nextMonth') {
            $scope.updateServiceLevelPay({ index: $scope.changePriceOfUpcomingInvoicePopupIndex, changePriceOfUpcomingInvoice:'nextMonth'});
            $scope.changePriceOfUpcomingInvoicePopup.close();
        }
        if (method == 'cancel') {
            $scope.waterBodyBillingModel[$scope.changePriceOfUpcomingInvoicePopupIndex].rate = $scope.waterBodyBilling[$scope.changePriceOfUpcomingInvoicePopupIndex].rate;
            $scope.changePriceOfUpcomingInvoicePopup.close();
        }
    }
    //updated billing setting top section    
    $scope.updateServiceLevelPay = function({index, type='', action, changePriceOfUpcomingInvoice='' } = {}){       
        if(!$scope.waterBodyBillingModel[index].rate){
            $scope.waterBodyBillingModel[index].rate = 0;              
        }
        if($scope.waterBodyBillingModel[index].rate == $scope.waterBodyBilling[index].rate && type != 'isChargeForChemicals'
        ){return false;}
        let postData = {data:{
            "id": $scope.waterBodyBillingModel[index].customerPayId ? $scope.waterBodyBillingModel[index].customerPayId : 0,
            "waterBodyId": $scope.waterBodyBillingModel[index].waterBodyId ? $scope.waterBodyBillingModel[index].waterBodyId : 0,
            "serviceLevelId": $scope.waterBodyBillingModel[index].serviceLevelId,
            "addressId":$scope.addressId,
            "poolTypeId": $scope.waterBodyBillingModel[index].poolTypeId,
            "rate": $scope.waterBodyBillingModel[index].rate,
            "isChargeForChemicals": $scope.waterBodyBillingModel[index].isChargeForChemicals == null ? true :$scope.waterBodyBillingModel[index].isChargeForChemicals,
            "isChemicalChanged": false,
            "actionPerformed": action ? action : "billing_schedule_price",
            "billing_schedule_name": $scope.waterBodyBillingModel[index].waterBodyName
        }}
        if(type == 'isChargeForChemicals'){
            postData.data.isChemicalChanged = true;
        }
        let apiURL = '/customer_pay';
        if(changePriceOfUpcomingInvoice != '' && changePriceOfUpcomingInvoice == 'rightNow'){
            apiURL = '/update_existing_upcoming_invoice';
            let payLoad = angular.copy(postData.data);
            payLoad.actionPerformed = changePriceOfUpcomingInvoice;
            postData = angular.copy(payLoad);
        }
        $scope.isProcessing = true;
        $scope.isFormDirty = true;
        apiGateWay.send(apiURL + "?companyId="+$scope.companyId, postData).then(function(response) {
            if (response.data.status == 200) {    
                //$scope.waterBodyBillingModel[index].customerPayId = response.data.data.id;
                $scope.waterBodyBilling[index] = angular.copy($scope.waterBodyBillingModel[index])
                //$scope.addDiscount(response.data.message);   
                //$scope.successMsg = response.data.message;
            
            } else {       
            $scope.errorMsg = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function(){
            $scope.successMsg = '';
            $scope.errorMsg = '';   
            }, 2000)
            
        }, function(error){
        $scope.isProcessing = false;
        })
    }  
    //Get Payment Profile 
    $scope.getPaymentProfile = function(){         
        apiGateWay.get("/payment_profile",  {customerId: $scope.modelBillingSettingObj.customerId}).then(function(response) {
            if (response.data.status == 200) {   
                if( $scope.modelBillingSettingObj.customerPaymentProfileId){
                    let profile = response.data.data.filter(function(i){ return i.id == $scope.modelBillingSettingObj.customerPaymentProfileId})               
                    $scope.modelBillingSettingObj.paymentProfileObj = profile[0];
                }
                $scope.paymentProfiles = response.data.data;               
                     
            } else {
                $scope.paymentProfiles = [];
            }          
        }, function(error){
        $scope.paymentProfiles = []; 
        })
    }  
   
    $scope.closeAllPopupProcessing = false;
    $scope.closeAllPopup = function(){
        $scope.closeAllPopupProcessing = true;
        $scope.toggleSwitch('isAutoCharge','route_popup_closed');
        $timeout(function(){
            ngDialog.closeAll();
        },500)        
        $timeout(function(){
            $scope.closeAllPopupProcessing = false;
        },1000)        
    }

    $scope.routeActivitySchedulePopup = function() {
        ngDialog.open({
          template: 'routeActivitySchedulePopup.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };

    $scope.getCustomerAuditLogs = function() {
        $scope.isProcessing = true;
        let jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            addressId: $scope.addressId,
        };
        apiGateWay.get("/get_route_audit_logs", jobParam).then(function(response) {
            if (response.data.status == 200) {
                $scope.isProcessing = false;                
                let auditLogsResponse = response.data.data;
                $scope.routeAuditLogsList = auditLogsResponse.data;
                $scope.routeAuditLogsList.forEach(item => {
                    if(item.message){
                        item.message = item.message.replace('Activated', '');
                        item.message = item.message.replace('Deactivated', '');
                    }
                })
                $scope.pageObj.totalRecordInv = auditLogsResponse.rows;                
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0; 
            } else {
                $scope.isProcessing = false;
            }
        }, function(error){
            $scope.isProcessing = false;
        });
    }

    $scope.goToCustomerInvoiceListPage = function(page) {
        $scope.pageObj.currentPageInv = page;
        $scope.getCustomerAuditLogs();
    };
    $scope.isUpcomingInvoiceAvailable = false;
    $scope.getInvoiceDayCreation = function() {
        apiGateWay.get("/customer_invoice_creation_date", {addressId:$scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.invCreatDateDetails = response.data.data;
                $scope.showInvoiceCreaPopup = $scope.invCreatDateDetails.showPopup;
                $scope.isUpcomingInvoiceAvailable = $scope.invCreatDateDetails.invoiceId != undefined && $scope.invCreatDateDetails.invoiceId != null && $scope.invCreatDateDetails.invoiceId != 0;
                $scope.invoiceTotalAmount = $scope.invCreatDateDetails.totalAmount;
            }
        });
    }

    $scope.saveInvoiceCreationDate = function(day, custom=null) {
        if (custom == 'custom') {
            var dayValueInput = document.getElementById('form-control-x-day');
            if (day) {
                dayValueInput.classList.remove('has-error');        
            }            
            if (isNaN(day) || day === '0' || day === 0 || day === '') {
                dayValueInput.classList.add('has-error');
            }
            if (day && day != '') {
                day = Number(day);
            }
            if (day > 31) {
                dayValueInput.classList.add('has-error');
            }
        }
        if(custom == 'custom' && (day == undefined || day == '')){
            return false
        }
        if(custom == 'custom' && day != ''){
            if(day < 1 || day > 31){
                return false
            }
        }
        apiGateWay.send("/customer_invoice_creation_date?addressId="+$scope.addressId,{newDay: day}).then(function(response) {
            if (response.data.status == 200) {
                $scope.invCreatDateDetails = response.data.data;
            }
        })
    }

    $scope.isDeactivateTypeCalledFromBtn = false;
    $scope.deactivateTyp = function(type) {
        if (type=='delete' && $scope.userCanDeleteInvoice==0) {
            return
        }        
        if (type=='create' && $scope.userCanCreateInvoice==0) {
            return
        }        
        $scope.deactivateType = type;
        $scope.isDeactivateTypeCalledFromBtn = true;
        $scope.saveSchedulerDetail($scope.model);
    }

    $scope.checkInvCreation = function() {
        $scope.routeToggleModified = true;
        if($scope.showInvoiceCreaPopup){
            if(!$scope.model.status){
                $scope.confirmInvoiceCreation();
            }
            else{
                $scope.saveSchedulerDetail($scope.model);
            }
        }
        else{
            $scope.saveSchedulerDetail($scope.model);
        }
    }
    $scope.sendToSocket = function(postData) {        
        if (postData.status == false) {
            var data = {
                "eventName": 'refreshPropertyStatus',                    
                "companyId": auth.getSession().companyId,
                "postData": postData           
            };
            $rootScope.socket.emit('refreshRouteJobStatus', data)
        }
    }
    $rootScope.updateCustAddrSchData = function() {
        var pdata = {
            addressId: $scope.addressId        
        };
        apiGateWay.get($rootScope.customerDetailEndpoint, pdata).then(function(response) {
            if (response.data.status == 200 && response.data.data) {
                if (response.data.data.custAddrSchData[0]) {
                    $rootScope.custAddrSchData = response.data.data.custAddrSchData[0];
                    $rootScope.custAddrSchData.addressRouteDetails = response.data.data.addressRouteDetails;
                    $rootScope.custAddrSchData.endDate = response.data.data.customer.endDate;
                    $scope.model.status = $rootScope.custAddrSchData.status;
                }                
                if (response.data.data.customerBillingTabData[0]) {
                    $scope.isRouteServiceDatesHidden = response.data.data.customerBillingTabData[0].isServiceDatesHidden;
                }
            }
        })
    }
    $scope.serviceDateToggle = function(node = 'isServiceDatesHidden') {
        $scope.isRouteServiceDatesHidden = !$scope.isRouteServiceDatesHidden;
        $scope.modelBillingSettingObj[node] = $scope.isRouteServiceDatesHidden;
        $scope.updateBillingSettings(node, 'service_date_toggle');
    }
});
