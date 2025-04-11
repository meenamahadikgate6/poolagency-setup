angular.module('POOLAGENCY').controller('oneTimeJobOverviewController', function($rootScope, $scope,$window, Carousel, deviceDetector, $timeout, $filter, $sce, apiGateWay, service, $state, $stateParams, ngDialog, Analytics, configConstant, auth, pendingRequests) {
    $rootScope.templateId = null;
    $scope.isPropertyInformation = configConstant[configConstant.currEnvironment].isPropertyInformation;
    $scope.isServiceSchedule = configConstant[configConstant.currEnvironment].isServiceSchedule;
    $scope.addressId = $stateParams.addressId;
    $scope.jobId = $stateParams.jobId;
    $rootScope.jobId = $stateParams.jobId;
    $rootScope.jobIdForOneTimeJob = $stateParams.jobId;    
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.onPageLoad = 0;
    $scope.limit = 5;
    $scope.dir = 'asc';
    $scope.column = 'technicianName';
    $scope.isProcessing = false; 
    $scope.weekDate = "";
    $scope.gaugeDescription='';
    $scope.techProfileImage = '';
    $scope.managerProfileImage = '';
    $scope.defaultAvatar = '';
    $scope.technicianName = '';
    $scope.technicianFirstName = '';
    $scope.technicianLastName = '';
    $scope.slides = [];
    $scope.dismissAlertSettingError = false;
    $scope.activityTitle = null;
    $scope.noJobDataAvailable = '';
    $scope.timeError = '';
    $scope.filterModel = {
        filterMonth: '90 days'
    }
    $scope.filterMonth2 = '90 days';
    $scope.jobActivityTime = {'jobId':$scope.jobId,'startDate':{'isUpdated':false, 'time':''},'endDate':{'isUpdated':false, 'time':''}};
    $scope.lastActivityTime = {'startDate':'','endDate':''};
    $scope.startTimePickerOption = {format: 'DD-MM-YYYY   hh:mm a', showClear: false, sideBySide: true}
    $scope.endTimePickerOptionOld = {format: 'DD-MM-YYYY   hh:mm a', showClear: false, sideBySide: true}
    $scope.activitychanged = false;
    $scope.startJobLog = [];
    $scope.endJobLog = [];
    $scope.showLoader = false;
    $scope.chemicalReadingLogs = {};
    
    $scope.tempCValue = '';
    $scope.chemicalStatusModel = {};
    $scope.loadingChemical = false;
    $scope.paramWaterBodyId = '';
    $scope.canEditReadings = auth.getSession().canEditReadings == 0 ? true : false;
    $scope.chemicalReading = {
        "chlorine": "",
        "ph": "",
        "phosphates": "",
        "salt": "",
        "alkalinity": "",
        "tds": "",
        "cya": ""
    };
   //one of job data
   $scope.createNewJob = {};
   $scope.waterBodyList = {};
   $scope.waterBodyListName = "";
   $scope.waterBodyName ="";
   $scope.waterBodyListId = "";
   $scope.jobTime =  {};
   $scope.jobTimeEndTime = "";
   $scope.jobTimeStartTime = "";
   $scope.jobTimeId = "";
   $scope.oneJobModel = {'addressId':'', 'jobId':'', 'title':'','waterBodyId':'', 'instruction':'','note':'','duration':'', 'templateId':'','timeId':''};
   $scope.jobStatus = {};
   $scope.quoteDetails = {};
   $scope.statusName = "Not Started";
   $scope.jobStatusId = "";
   $scope.statusId = "";
   $scope.jobTemplate = {};
   $scope.templateName = "";
   $scope.bundleSearchForm = false;
   $scope.isBundleSearch = false;
   $scope.productBundleList = {}; 
   $scope.productBundleListCategory = "";
   $scope.isProcessing = false;
   $scope.isJobDataLoading = true;
   $scope.bundleList = [];
   $scope.bundleListNew = [];
   $scope.bundleSearchText = '';
   $scope.productEdit = false;
   $scope.bundleSearchListNew = '';
   $scope.productBundleListNew = [];
   $scope.productNoItem = false;
   $scope.scheduled = {};
   $rootScope.unscheduled = "";
   $rootScope.jobEmailStatusId = "";
   $scope.technicianDetail = "";
   $scope.shortName = "";
   $scope.bundleTotal = 0;
   $scope.bundleSubTotal = 0;
   $scope.costBundleTotal = 0;
   $scope.bundleQtyText = "1";
   $scope.bundleCost  = "";
   $scope.bundleQtyPrice = "";
   $scope.qtyBundle = "";
   $scope.jobStatusIcon = '';
   $scope.selectwaterBody = 'Select';
   $scope.jobStatusClass = "not-started";
   $scope.selectTime =  "Choose";
   $scope.templateNameNew = "Select";
   $scope.templateId = "";
   $scope.addressId = "";
   $scope.oneJobItemDiscount = "";
   $scope.discountTitle = "";
   $scope.discountValue = "";
   $scope.discountCalculation = 0;
   $scope.jobStatusId = "";
   $scope.payOptionData = "";
   $scope.payOption = "";
   $scope.payId = "";
   $scope.payOptionValue = "Select";
   $scope.dueDate = "";
   $scope.companyId = "";
   $scope.taxTitle = "";
   $scope.taxValue = 0; 
   $scope.taxPercentValue = "";
   $scope.statusComplete = false;
   $scope.waterBodyObj = {};
   $scope.endTimePickerOption = {format: 'hh:mm'};
   $scope.addJobSetting= false;
   $scope.jobTemplateId = '';
   $scope.saveOneTimeJobVar = false;
   $scope.editTemplate = false;
   $scope.editFilterTemplate = false; 
   $scope.editFilterTemplateId = '';
   $scope.isSystem = '';
   $scope.customTemplate = [];
   $scope.durationOption = {format: 'HH:mm', showClear: false, widgetParent: '#oneTimeJobDurationPickerParent'};
   $scope.discountType = '%';
   $scope.assignRouteDate = '';
   $scope.datePickerOption = {format: 'MM/DD/YYYY', showClear: false};
   $scope.statusClosed = false;
   $scope.blankOverlay = false;
   $rootScope.jobEmailIcon = false;
   $scope.isProductAreaFocused = false;
   $scope.isProcessingTechnician = false;
   $scope.isFirstTimeLoad = true;
   $scope.jobTechnician = null;
   $scope.saleTechnician = null;
   $scope.jobTechnicianList = [];
   $scope.saleTechnicianList = [];
   $scope.techSearchKeyJob = null;
   $scope.techSearchKeySale = null;
   $scope.techSearchBoxJob = {techSearchText:''};
   $scope.techSearchBoxSales = {techSearchText:''};
   $scope.showCommision = false;
   $scope.showCommisionText = "view details";
   $scope.reScheduledFrom = null;
   $scope.reScheduledTo = null;
   $scope.sentEmailModel = {
     email:'',
     jobId:''
    };
    $scope.taxEnabledForProduct = 0;
    $scope.taxEnabledForService = 0;
    $scope.installer = {
        installerId : ''
    }
    $scope.instHistory = [];

    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createTime';
    $scope.permissions = {};
    if (auth.getSession()) {
        $scope.permissions = auth.getSession();
    }
    $scope.forTaxUpdateOnly = false;
    $scope.oneTimeJob = function() {      
    setTimeout(function(){
        angular.element("#statusDropdown").focus();
    }, 100);
    let createdJobId = $scope.jobId;
    setTimeout(function() {
        apiGateWay.get("/customer_short_details", {
            jobId: $scope.jobId,
        }).then(function(response) {
            if (response.data.status == 200) {  
                $rootScope.customerDetails = response.data.data;
                $rootScope.primaryEmail = $rootScope.customerDetails.customer.primaryEmail;                
                let createdJobId = $scope.jobId;
                $rootScope.customer = response.data.data.customer;
                $rootScope.jobStatus = $rootScope.customer.jobStatus;
            } else {

            }
        });
}, 0);
    apiGateWay.get("/one_off_job", {
        jobId: createdJobId,
    }).then(function(response) {
        // START ** If Job deleted or not found redirect to customer detail page
        if (response.status === 204) {
            $state.go("app.customerdetail", {
                addressId: $stateParams.addressId
            });
        }
        // END ** If Job deleted or not found redirect to customer detail page
        if (response.data.status == 200) {                  
                
              $scope.oneJobModel =   response.data.data;
              $scope.reScheduledFrom = $scope.oneJobModel.reScheduledFrom ? $scope.oneJobModel.reScheduledFrom : null;
              $scope.reScheduledTo = $scope.oneJobModel.reScheduledTo ? $scope.oneJobModel.reScheduledTo : null;
              if(response.data.data.job.duration){
                 $scope.oneJobModel.job.duration =  "2014-02-27T"+response.data.data.job.duration;
              } else {
                $scope.oneJobModel.job.duration = "2014-02-27T00:00";
              }
              $scope.addressId = $scope.oneJobModel.job.addressId;
              
              $scope.waterBodyList =  $scope.oneJobModel.waterBody;
              $scope.waterBodyListName = $scope.oneJobModel.waterBody.waterBodyName;
              $scope.jobTime =  $scope.oneJobModel.time;
              $scope.waterBodyId = $scope.oneJobModel.job.waterBodyId;
              let waterBodies = $scope.oneJobModel.waterBody;

              angular.forEach(waterBodies, (element, index) => {
                if($scope.waterBodyId == element.id){
                    $scope.selectwaterBody =  element.waterBodyName;  
                    $scope.waterBodyObj = element; 
                    $scope.waterBodyObj['jobId'] =  $scope.jobId;                     
                }

              }); 
              if (angular.isDefined($rootScope.getEquipmentDetails) && angular.isFunction($rootScope.getEquipmentDetails)) {
                
                $rootScope.getEquipmentDetails($scope.waterBodyObj);
            }
            $scope.getCustomerInfo();
              if (angular.isDefined($rootScope.getJobDetailByWaterBody) && angular.isFunction($rootScope.getJobDetailByWaterBody)) {
                $scope.getJobDetailByWaterBody($scope.waterBodyId);
            }
            
            let dueDate = response.data.data.job.dueDate;
            let dateString = moment(dueDate).format('MM/DD/YYYY');
            if(dueDate){
               $scope.dueDate = dateString;
            } else {
               $scope.dueDate = "";
            }

            
            

            
              
              let selectTime = $scope.oneJobModel.time;
              $scope.jobTimeId = $scope.oneJobModel.job.timeId; 
              if($scope.jobTimeId == 0){
                $scope.selectTime = "Anytime";
              } else {
                angular.forEach(selectTime, (element, index) => {
                    if($scope.jobTimeId == element.id){
                        $scope.selectTime =  element.period;   
                    }
                });
            }
              
              angular.forEach($scope.jobTime, (element, index) => {
                $scope.jobTimeEndTime = element.endTime;
                $scope.jobTimeStartTime = element.startTime;
              });
              

              jobStatus = response.data.data.jobStatus;
              $scope.jobStatus = $scope.oneJobModel.jobStatus;

              $scope.jobStatusId = $scope.oneJobModel.job.jobStatus;
              if($scope.jobStatusId == 4){
                $rootScope.jobEmailIcon = true;
              }
              if($scope.jobStatusId == 5){
                $scope.blankOverlay = true;
                $rootScope.jobEmailIcon = true;
              }
              
              $rootScope.jobEmailStatusId = $scope.oneJobModel.job.jobStatus;
              $rootScope.jobStatus =  $scope.statusId;
              angular.forEach(jobStatus, (element, index) => {
                    if($scope.jobStatusId == element.id){
                        $scope.statusName = element.statusName;  
                        $scope.statusId =  element.id; 
                        if($scope.statusId == 4){
                            $scope.statusComplete = true;
                        }
                    }
              });             
              $scope.parseScheduleData($scope.oneJobModel.scheduleStatus)              
              

              $scope.waterBodyListId = response.data.data.job.waterBodyId;

              $scope.jobTemplate = $scope.oneJobModel.jobTemplate;
              $scope.templateName = $scope.oneJobModel.jobTemplate.templateName;
              if(response.data.data.job.templateId){
                $scope.templateId = response.data.data.job.templateId; 
                angular.forEach($scope.jobTemplate, (element, index) => {
                    if($scope.templateId == element.id){
                        $scope.templateNameNew =  element.templateName;   
                    }
                });
              }
              
              if(response.data.data.quoteDetails){
                $scope.quoteDetails  = response.data.data.quoteDetails;
              } 

              setTimeout(function(){
                $(".mainContent").removeClass("not-loading");  
              }, 200);

              
        } else {

        }
        $scope.isJobDataLoading = false
    }, function(error) {
        $scope.isJobDataLoading = false
    });


    apiGateWay.get("/one_job_item", {
        jobId: createdJobId,
    }).then(function(response) {            
        if (response.data.status == 200) { 
            bundleSubTotal = response.data.data.subTotalAmount;

            if(bundleSubTotal){
                $scope.bundleSubTotal = bundleSubTotal;
            } else {
                $scope.bundleSubTotal = 0.00;
            }
            let productBundleListNew = response.data.data.productAndService;
            if(productBundleListNew){
                $scope.productBundleListNew = productBundleListNew; 
                if (Object.keys(productBundleListNew).length === 0 ) {
                    $scope.productBundleListNew = [];
                }
                angular.forEach($scope.productBundleListNew, (element, index) => {
                    element.price = isNaN(Number(element.price)) ? Number(element.price.replace('$', '')) : Number(element.price);
                    if (element.bundleItemReference && element.bundleItemReference.length > 0) {
                        angular.forEach(element.bundleItemReference, (element2, index2) => {
                            element2.price = isNaN(Number(element2.price)) ? Number(element2.price.replace('$', '')) : Number(element2.price);
                            if(!element2.duration || element2.duration == 'None'){
                                element2.duration = '00:00:00';
                            }
                        });
                    }
                    else{
                        if(!element.duration || element.duration == 'None'){
                            element.duration = '00:00:00';
                        }
                    }
                });
                $scope.productBundleListNewCategory = response.data.data.productAndService.category; 
                $scope.calculateBundleCost();
            }  

            if(response.data.data.taxPercentValue){
                $scope.taxPercentValue = response.data.data.taxPercentValue;
            } else{
                $scope.taxPercentValue = "";
            }
            if(response.data.data.discountTitle){
                var str = response.data.data.discountTitle;
                if(str.includes("$") == true){
                    let matches = str.replace("$", "");
                    $scope.discountType = '$';
                    $scope.discountTitle = '';
                    $scope.discountValue = matches;
                } 
                if(str.includes("%") == true){
                    let matches = str.replace("%", "");
                    $scope.discountValue = matches;
                    $scope.discountTitle = response.data.data.discountTitle;
                    $scope.discountType = '%';
                }
            } else {
                $scope.discountTitle = "";
                $scope.discountCalculation =  "";
                $scope.discountValue = "";
            }

            if(response.data.data.taxTitle){
                if (response.data.data.taxPercentValue == 0 && response.data.data.taxTitle == 'Tax') {
                    $scope.taxTitle = ""
                } else {
                    $scope.taxTitle = response.data.data.taxTitle
                }
            } else {
                $scope.taxTitle = "";
            }

            setTimeout(function() {
                $scope.getSubtotalForTax();
                $scope.onPageLoad = 1;
                $scope.forTaxUpdateOnly = true;
                $scope.chargeTax();
            }, 100)
            
            $scope.payOptionData = response.data.data.payOption;
            angular.forEach($scope.payOptionData, (element, index) => {
                payOptionValue = response.data.data.payOptionSelected;
                if(element.id == payOptionValue){
                    $scope.payOptionValue = element.option;
                    $scope.payOption = element.option;
                    $scope.payId = element.id;
                }
                
            });
            
            
            
            if(response.data.data.totalAmount){
                $scope.bundleTotal = response.data.data.totalAmount;
            } else {
                $scope.bundleTotal = 0;
            }
            
            $scope.taxData = response.data.data.taxData;            
            angular.forEach($scope.taxData, (element, index) => {
                $scope.companyId = element.companyId;                
            });
            $scope.getDefaultTaxData();
            if(response.data.data.taxValue){
                $scope.taxValue = response.data.data.taxValue;
            } else{
                $scope.taxValue= 0;
            }
            if(response.data.data.discountValue){
                $scope.discountCalculation = response.data.data.discountValue;
            } else{
                $scope.discountCalculation = 0;
            }
            
            
        } else {
            $scope.productNoItem = true;               
        }
    });


    apiGateWay.get("/one_job_invoice_detail", {
        jobId: $scope.jobId,
    }).then(function(response) {            
        if (response.data.status == 200) {
            if(response.data.data && 'createdOn' in response.data.data){
                $scope.createdOn = moment(response.data.data.createdOn).format('MM/DD/YYYY');
            } else {
                $scope.createdOn = '';
            }
            if(response.data.data && 'invoiceId' in response.data.data){
                $scope.invoiceId = response.data.data.invoiceId;
            } else {
                $scope.invoiceId = '';
            }
            if(response.data.data && 'invoiceNumber' in response.data.data){
                $scope.invoiceNumber = response.data.data.invoiceNumber;
            } else {
                $scope.invoiceNumber = '';
            }
        } else {
            $scope.createdOn = '';
            $scope.invoiceId = '';
            $scope.invoiceNumber = '';
        }
    });
    
    // $scope.getJobCommisionDetails(parseInt($scope.jobId));
}

var lastSaveOneTimeJobAPIHit = 0;
var lastSaveOneTimeJobAPIHitDelay = 20;
$scope.saveOneTimeJob = function() {
            if(typeof $scope.oneJobModel.job.duration == "object" && moment($scope.oneJobModel.job.duration, 'HH:MM',true).isValid()){
                var jobDuration = moment($scope.oneJobModel.job.duration).format('HH:mm').toString();
            } else {
                var jobDuration = $scope.oneJobModel.job.duration;
            }
            if (jobDuration == "Invalid Date") {                
                jobDuration = '00:00'
            }
            jobDuration = typeof jobDuration == "string" && jobDuration.slice(-5);
            let timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(jobDuration)) {
                jobDuration = '00:00';
            }
            let createdJobId = $scope.jobId;
            $rootScope.jobStatus = $scope.statusId;
            var dueDate = moment($scope.dueDate).format('MM/DD/YYYY').toString();
            if ($scope.waterBodyListId == '') {
            }
            let saveOneTimeJobData = {
                "addressId":$scope.addressId,
                "dueDate" : dueDate,
                "jobId": createdJobId,
                "title":$scope.oneJobModel.job.jobTitle, 
                "waterBodyId":$scope.waterBodyListId,
                "instruction":$scope.oneJobModel.job.instruction,
                "note":$scope.oneJobModel.job.note,
                "duration":jobDuration,
                "templateId":$scope.templateId,
                "timeId":$scope.jobTimeId,
                "jobStatus":$scope.statusId,
                "actionPerformed": $rootScope.actionPerformed,
                "body_of_water_name": $scope.selectwaterBody,
                "changed_time_value": $scope.selectTimePeriod
            };
            $scope.oneJobModel.job.jobStatus = $scope.statusId;
            //Sync job status via socket
            try{
                var jobInfo = $scope.oneJobModel.job;
                var statusArr = $scope.oneJobModel.jobStatus.filter(function(elm){ return elm.id == $scope.statusId});
                var statusJson = {
                    oneOfJobId: jobInfo.jobId, 
                    addressId: jobInfo.addressId, 
                    date: moment($scope.assignRouteDate).format('YYYY-MM-DD').toString(), 
                    status: statusArr[0].statusName, 
                    companyId: auth.getSession().companyId
                };
                $rootScope.socket.emit('refreshRouteJobStatus', statusJson)
                
            }catch(e){

            }
            if (lastSaveOneTimeJobAPIHit >= (Date.now() - lastSaveOneTimeJobAPIHitDelay)) {
                return;
            } else {
                lastSaveOneTimeJobAPIHit = Date.now();
                apiGateWay.send("/one_off_job", saveOneTimeJobData).then(function(response) {
                    if (response.data.status == 201) {
                        $rootScope.actionPerformed = null;
                        $scope.changeStatus($scope.addressId);
                        $scope.successProductForm = response.data.message; 
                        setTimeout(function() {
                            $scope.successProductForm = "";
                        }, 2000);         
                    } else {
                        $scope.errorProductForm = 'Error';
                        setTimeout(function() {
                            $scope.errorProductForm = "";
                        }, 2000);
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
}

var lastAPIHit = 0;
var lastAPIHitDelay = 20; 
$scope.saveOneTimeJobItem = function(discountCalculation) {
    if($scope.discountCalculation){
        if($scope.discountType == '$'){
            var discountTitle = $scope.discountType + $scope.discountValue;
        } else{
            var discountTitle = $scope.discountValue + $scope.discountType;
        }  
    } else {
        var discountTitle = "";
    }   
    let createdJobId = $scope.jobId;
    $scope.getTrimmedVals();    
    setTimeout(function() {
        if (lastAPIHit >= (Date.now() - lastAPIHitDelay)) {
            return;
        } else {
            lastAPIHit = Date.now();
            // remove $ from price
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.price = isNaN(Number(element.price)) ? Number(element.price.replace('$', '')) : Number(element.price);
                if (element.bundleItemReference && element.bundleItemReference.length > 0) {
                    angular.forEach(element.bundleItemReference, (element2, index2) => {
                        element2.price = isNaN(Number(element2.price)) ? Number(element2.price.replace('$', '')) : Number(element2.price);
                    });
                }
            });
            let saveOneTimeJobItem = {
                "itemReference":$scope.productBundleListNew,
                "jobId":createdJobId,
                "payOption":$scope.payId,
                "subTotalAmount":$scope.bundleSubTotal,
                "discountTitle":discountTitle,
                "discountValue":$scope.discountCalculation,
                "taxTitle":$scope.taxTitle,
                "taxValue":$scope.taxValue,
                "taxPercentValue":$scope.taxPercentValue,
                "totalAmount":$scope.bundleTotal,
                "taxableSubtotalAmount":$scope.taxableSubtotal,
                "actionPerformed": $rootScope.actionPerformed,
                changed_products_services_name: $scope.changed_products_services_name,
                changed_products_services_action: $scope.changed_products_services_action,
                changed_products_services_type: $scope.changed_products_services_type,
                changed_products_services_index: $rootScope.changed_products_services_index,
                changed_products_bundle_name: $scope.changed_products_bundle_name,
                changed_products_sub_part_type: $scope.changed_products_sub_part_type,
                changed_products_sub_part_name: $scope.changed_products_sub_part_name,
                changed_products_sub_part_action: $scope.changed_products_sub_part_action,
                changed_products_sub_part_qty: $scope.changed_products_sub_part_qty,
                changed_products_sub_part_price: $scope.changed_products_sub_part_price,
                "changed_products_bundle_id": $scope.changed_products_bundle_id,
                "onPageLoad": $scope.onPageLoad
            };
            for (var propName in saveOneTimeJobItem) {
                if (saveOneTimeJobItem[propName] === null || saveOneTimeJobItem[propName] === undefined) {
                delete saveOneTimeJobItem[propName];
                }
            }    
            if($scope.forTaxUpdateOnly) {
                saveOneTimeJobItem.forTaxUpdateOnly = true;
                $scope.forTaxUpdateOnly = false
            }
            apiGateWay.send("/one_job_item", saveOneTimeJobItem).then(function(response) {
                if (response.data.status == 201 || response.data.status == 200) {
                    // $rootScope.actionPerformed = null;
                    $scope.getJobCommisionDetails(parseInt($scope.jobId));
                    if(response.data.data.duration){
                        $scope.oneJobModel.job.duration = "2020-11-03T"+ response.data.data.duration;
                    }
                    if(response.data.data.taxPercentValue){
                        $scope.taxPercentValue = response.data.data.taxPercentValue;
                        $scope.trimmedData.tax = $scope.roundUpAtHundreds($scope.taxValue);
                    }
                    if(response.data.data.taxTitle){
                        $scope.taxTitle = response.data.data.taxTitle;
                    }
                    $scope.successProductForm = response.data.message;
                    setTimeout(function() {
                        $scope.successProductForm = "";
                    }, 2000);       
                    $scope.onPageLoad = 0;
                } else {
                    $scope.errorProductForm = 'Error';
                    setTimeout(function() {
                        $scope.errorProductForm = "";
                    }, 2000);
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
    }, 200)
}

$scope.addBundleProductSearch = () => {
    $scope.saveOneTimeJobVar = true;
    $scope.bundleSearchForm = true;
    setTimeout(function(){
        angular.element("#bundleSearchText").focus();
    }, 100);
    
}

$scope.$on('productAddEvent', function(event, data) {    
    if (data && data.widgetArea == 'oneTimeJob') {
        if (data.isClose) {
            $scope.bundleSearchForm = false;
            return
        }
        let totalCheck = 0;
        if (data.bundleItemReference && data.bundleItemReference.length > 0) {
            let total = 0;
            angular.forEach(data.bundleItemReference, function(item){
                item.unitPrice = (typeof item.price === "number") ? item.price : parseFloat(item.price.replace(/[^0-9.-]/g, ''));
                total += (item.qty) * (item.unitPrice);
            });
            totalCheck = $scope.bundleTotal + total;
        } else {
            totalCheck = $scope.bundleTotal + data.price;
        }
        if (totalCheck < 0) {          
            $scope.errorProductForm = "The job total can't be less than $0.00";
            setTimeout(function() {
                $scope.errorProductForm  = "";
            }, 2000);
        } else {
            $rootScope.setActionPerformed('changed_products_services');
            $scope.addProductToBundle(data);
        }          
    }
}); 
$scope.addProductToBundle = (productBundleListCategory) => {
    $scope.changed_products_services_name = productBundleListCategory.name;
    $scope.changed_products_services_action = "add";
    $scope.changed_products_services_type = productBundleListCategory.category;
    if(productBundleListCategory.bundleItemReference && productBundleListCategory.bundleItemReference.length > 0) {
        angular.forEach(productBundleListCategory.bundleItemReference, (element, index) => {
            //  if isChargeTax is missing from element
            if ((element.isChargeTax === undefined || element.isChargeTax ===  null)) {                
                apiGateWay.get("/product_services_save", {
                    id: element.id
                }).then(function(response) {
                    var isChargeTax;
                    //  if isChargeTax is missing from response
                    if(response.data.data.isChargeTax === undefined || response.data.data.isChargeTax === null) {
                        if (element.category == "Product") {
                            if ($scope.defaultTaxSettingData.companyProductTax == 1) {
                                isChargeTax = 1
                            } else {
                                isChargeTax = 0
                            }
                        }
                        if (element.category == "Service") {
                            if ($scope.defaultTaxSettingData.companyServiceTax == 1) {
                                isChargeTax = 1
                            } else {
                                isChargeTax = 0
                            }
                        }
                    } else {
                        //  if isChargeTax is not missing from response
                        isChargeTax = response.data.data.isChargeTax;
                    }
                    element.isChargeTax = isChargeTax;
                    $scope.bundleSearchText = "";
                    $scope.bundleSearchForm = false;                     
                }, function(error){
                });
            } 
        });
    }   
    if($scope.productNoItem == true){
        let bundleObj = [{
            "category":productBundleListCategory.category, 
            "description": productBundleListCategory.description ? productBundleListCategory.description : '',
            "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null,
            "cost": productBundleListCategory.cost, 
            "id": productBundleListCategory.id, 
            "name": productBundleListCategory.name, 
            "price": productBundleListCategory.price, 
            "sku": productBundleListCategory.sku,
            "isChargeTax": productBundleListCategory.isChargeTax ? productBundleListCategory.isChargeTax : 0,
            "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
            "duration": productBundleListCategory.duration
        }];
        $scope.productBundleListNew = bundleObj;
        $scope.productBundleListNewCategory = bundleObj.category;
        $scope.productNoItem = false; 
    } else {
        let bundleObj = {
            "category":productBundleListCategory.category,
            "description": productBundleListCategory.description ? productBundleListCategory.description : '',
            "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null, 
            "cost": productBundleListCategory.cost,
            "sku": productBundleListCategory.sku?productBundleListCategory.sku:'', 
            "id": productBundleListCategory.id, 
            "name": productBundleListCategory.name, 
            "price": productBundleListCategory.price,
            "isChargeTax": productBundleListCategory.isChargeTax ? productBundleListCategory.isChargeTax : 0,
            "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
            "duration": productBundleListCategory.duration
        };
        $scope.productBundleListNew.push(bundleObj);
        $scope.productBundleList = angular.copy($scope.productBundleListNew);
        // $scope.calculateBundleDurationTemp($scope.productBundleListNew);
    }
    $scope.onPageLoad = 0;
    $scope.chargeTax();
    $scope.isBundleSearch = false;
    $scope.bundleSearchForm = false;
    $scope.bundleCost = productBundleListCategory.cost;
    // durationFnc $scope.calculateDuration('add', productBundleListCategory);
    $scope.calculateBundleCost();
    $scope.isFirstTimeLoad = true;
    $scope.saveOneTimeJobItem();
}

$scope.removeProductToBundle = function(productBundleListNew, index){ 
    if ($scope.productBundleListNew.length > -1){
        let total = (typeof $scope.bundleSubTotal === "number") ? $scope.bundleSubTotal : parseFloat($scope.bundleSubTotal.replace(/[^0-9.-]/g, ''));
        let itemTotal = (typeof $scope.productBundleListNew[index].price === "number") ? $scope.productBundleListNew[index].price : parseFloat($scope.productBundleListNew[index].price.replace(/[^0-9.-]/g, ''));
        itemTotal = (itemTotal) * ($scope.productBundleListNew[index].qty);
        itemTotal = itemTotal < 0 ? Math.abs(itemTotal) : itemTotal;
        if ((total - itemTotal) < 0) {
            $scope.errorProductForm = "The job total can't be less than $0.00";
            setTimeout(function () {
                $scope.errorProductForm = "";
            }, 2000);
            return false;
        }
        $scope.changed_products_services_name = $scope.productBundleListNew[index].name;
        $scope.changed_products_services_action = "remove";
        $scope.changed_products_services_type = $scope.productBundleListNew[index].category;
        // durationFnc $scope.calculateDuration('subtract', productBundleListNew[index]);
        $scope.productBundleListNew.splice( index, 1);
        // $scope.calculateBundleDurationTemp($scope.productBundleListNew);
    }    
    if($scope.productBundleListNew.length == 0){
        $scope.bundleSubTotal = 0;
        $scope.bundleTotal = 0;
        $scope.discountCalculation = 0;
        $scope.discountValue = 0;
        $scope.taxValue = 0;
        $scope.taxTitle = "";
        $scope.taxPercentValue  = 0;
        $scope.discountTitle = "";
    }
    $scope.calculateBundleCost();
    $scope.isFirstTimeLoad = true;
    $scope.saveOneTimeJobItem();
    $scope.updateDiscounts();
    $scope.updateTaxes();
}

$scope.calculateDuration = (type, value) => {
    var _isService = value.category === "Service" || false;    
    if (_isService) {
        var _TotalDuration = $scope.oneJobModel.job.duration.format('HH:mm:ss');
        var _TotalDurationArr = _TotalDuration.split(':');
        var _TotalDurationInSeconds = (+_TotalDurationArr[0]) * 60 * 60 + (+_TotalDurationArr[1]) * 60 + (+_TotalDurationArr[2]);
        var _ServiceDuration = value.duration;
        var _ServiceDurationArr = _ServiceDuration.split(':');
        var _ServiceDurationInSeconds = (+_ServiceDurationArr[0]) * 60 * 60 + (+_ServiceDurationArr[1]) * 60 + (+_ServiceDurationArr[2]);
        var _UpdatedDuration = '';
        if (type === 'add') {
            // if new duration greater then 23:59 hrs
            if ((_TotalDurationInSeconds + _ServiceDurationInSeconds) > (24 * 60 * 60)) {
                _UpdatedDuration = '23:59:59';
            } else {
                _UpdatedDuration = moment(_TotalDuration, 'HH:mm:ss').add(_ServiceDurationInSeconds, 'seconds').format('HH:mm:ss');                
            }
        } 
        if (type === 'subtract') {
            // if service duration is greater then totalDuration
            if (_ServiceDurationInSeconds > _TotalDurationInSeconds) {
                _UpdatedDuration = '00:00:00';
            } else {
                _UpdatedDuration = moment(_TotalDuration, 'HH:mm:ss').subtract(_ServiceDurationInSeconds, 'seconds').format('HH:mm:ss');
            }
        }
        // $scope.oneJobModel.job.duration = moment('2014-02-27T' + _UpdatedDuration);
        $scope.saveOneTimeJob();
    }  
}

$scope.calculateBundleCost = (qty,index,bundleItem,name, id) => {
    if($rootScope.actionPerformed == 'changed_products_services_qty'){
        $scope.changed_products_services_name= null,
        $scope.changed_products_services_action= null,
        $scope.changed_products_sub_part_type = null;
        $scope.changed_products_sub_part_name = null;
        $scope.changed_products_sub_part_qty = null;
        $scope.changed_products_sub_part_action = null;
        $rootScope.changed_products_services_index = index;
        $scope.changed_products_sub_part_price = null;
    }
    else{
        if(bundleItem){
            $scope.changed_products_bundle_name = name;
            $scope.changed_products_sub_part_type = bundleItem.category;
            $scope.changed_products_sub_part_name = bundleItem.name;
            $scope.changed_products_sub_part_qty = bundleItem.qty;
            $scope.changed_products_sub_part_action = "qty",
            $scope.changed_products_sub_part_price = bundleItem.qty*bundleItem.price;
            $rootScope.changed_products_services_index = null;
        }
    }
    if(id !== undefined) {
        $scope.changed_products_bundle_id = id;
    } else {
        $scope.changed_products_bundle_id = null;
    }
    if ($scope.productBundleListNew.length > 0 && !$rootScope.negativeCheckPassed($scope.productBundleListNew)) {
        $scope.errorProductForm = "The job total can't be less than $0.00";
        setTimeout(function () {
            $scope.errorProductForm = "";
        }, 2000);
        return;
    }
    $scope.bundleSubTotal = 0;
    if($scope.productBundleListNew.length > 0){
        angular.forEach($scope.productBundleListNew, function(value, key) {
            $scope.productBundleListNew[key].qty = parseFloat(value.qty);
            if((value.category == "Bundle" || value.category == "bundle")){
                var bundleItemTotal = 0;
                angular.forEach(value.bundleItemReference, function(v, k) {
                    var pfmt = (typeof v.price === "number") ? v.price : parseFloat(v.price.replace(/[^0-9.-]/g, ''));
                    bundleItemTotal = bundleItemTotal + $rootScope.negativeRoundUp(pfmt*(v.qty));                    
                    $scope.productBundleListNew[key].price = bundleItemTotal;                  
                });
                
                var frmt = (typeof $scope.productBundleListNew[key].price === "number") ? $scope.productBundleListNew[key].price : parseFloat($scope.productBundleListNew[key].price.replace(/[^0-9.-]/g, ''));
                bundleItemTotal = frmt;
                bundleItemTotal = $rootScope.negativeRoundUp(bundleItemTotal * (value.qty));
                $scope.bundleSubTotal = $scope.bundleSubTotal + bundleItemTotal;
                $scope.bundleTotal = $scope.bundleSubTotal;                
            }else{
                var pfmt = pfmt = (typeof value.price === "number") ? value.price : parseFloat(value.price.replace(/[^0-9.-]/g, ''));
                $scope.bundleSubTotal = $scope.bundleSubTotal + $rootScope.negativeRoundUp(pfmt*(value.qty));
                $scope.bundleTotal = $scope.bundleSubTotal;               
            }
            
        })
        
    }

    if($scope.discountValue){
        $scope.discountTitle = $scope.discountValue+$scope.discountType;
    }
    $scope.updateDiscounts(index);
    if($scope.bundleTotal.toFixed(2) > 0){
        $scope.errorDiscount = false;

        if($scope.discountType == '%'){        
            $scope.discountCalculation = ($scope.bundleSubTotal*$scope.discountValue)/100;
            let taxValue = ($scope.getSubtotalForTax(index)) * $scope.taxPercentValue/100
            $scope.taxValue = taxValue;
            let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
            $scope.bundleTotal = bundleTotal + $scope.taxValue; 
        } else {
            let taxValue = ($scope.getSubtotalForTax(index)) * $scope.taxPercentValue/100
            $scope.taxValue = taxValue;
            let discountCalculation = $scope.bundleSubTotal-$scope.discountValue+$scope.taxValue; 
            $scope.discountCalculation = $scope.discountValue;
            $scope.bundleTotal = discountCalculation;
        }

        if($scope.discountValue){
            $scope.discountTitle = $scope.discountValue+$scope.discountType;
        }

        let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
        $scope.bundleTotal = bundleTotal + $scope.taxValue; 

        if(qty){
            $scope.isFirstTimeLoad = true;
            $scope.saveOneTimeJobItem();
        }
    } else {    
        if(qty){
            $scope.isFirstTimeLoad = true;
            $scope.saveOneTimeJobItem(); 
        }
        // $scope.errorDiscount = true;
        setTimeout(function() {
            $scope.errorDiscount = false;
        }, 2000);
        if ($scope.bundleTotal.toFixed(2) == 0 && $scope.productBundleListNew.length > 0) {
            $scope.errorDiscount = false;
        }
    }
    $scope.updateDiscounts(index);
    $scope.updateTaxes(index);
//   } else {
//     console.log('not passed negative check');
//   }
}

$scope.updateTaxes = (index) => {
    if ($scope.taxPercentValue) {
        $scope.taxValue = ($scope.getSubtotalForTax(index))*$scope.taxPercentValue/100;
        $scope.bundleTotal = ($scope.bundleSubTotal-$rootScope.negativeRoundUp($scope.discountCalculation))+$scope.taxValue;
    }
}

$scope.updateDiscounts = () => {
    if($scope.discountType == '%'){        
        $scope.discountCalculation = ($scope.bundleSubTotal*$scope.discountValue)/100;
        let bundleTotal = $scope.bundleSubTotal - ($scope.discountCalculation);
        $scope.bundleTotal = bundleTotal + $scope.taxValue; 
    } else {
        let discountCalculation = $scope.bundleSubTotal-($scope.discountCalculation)+$scope.taxValue; 
        $scope.discountCalculation = $scope.discountValue;
        $scope.bundleTotal = discountCalculation;        
    }
    if($scope.discountValue){
        $scope.discountTitle = $scope.discountValue+$scope.discountType;
    }
}
$scope.openChangeJobStatusConfirmation = (statusName, skipInvoiceCreation) => {
    $scope.selectedJobForStatusChangeData = {
        statusName: statusName,
        skipInvoiceCreation: skipInvoiceCreation,
        selectedJobType: 'oneTimeJob'
    }
    $scope.openChangeJobStatusConfirmationModal = ngDialog.open({            
        id  : 11,
        template: "templates/openChangeJobStatusConfirmation.html?ver="+$rootScope.PB_WEB_VERSION,
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function () {
            $scope.selectedJobForStatusChangeData = {};
        }
    });    
}
$scope.changeJobStatusConfirmed = (data) => {
    let statusName = data.statusName;
    let skipInvoiceCreation = data.skipInvoiceCreation;
    $scope.selectJobStatusAPI(statusName, skipInvoiceCreation);
}
$scope.selectJobStatus = (statusName, skipInvoiceCreation = false) => { 
    if (statusName.statusName == 'Completed') {
        $scope.openChangeJobStatusConfirmation(statusName, skipInvoiceCreation)            
    } else {
        $scope.selectJobStatusAPI(statusName, skipInvoiceCreation)
    }
}
$scope.selectJobStatusAPI = (statusName, skipInvoiceCreation) => { 
        if ($scope.openChangeJobStatusConfirmationModal) {
            $scope.openChangeJobStatusConfirmationModal.close();
        }      
        if(!skipInvoiceCreation && statusName.id == 5){
            if($scope.productBundleListNew.length > 0){
                $scope.checkJobInvoice($scope.jobId);
                if(!$scope.invoceCreatedOn && !$scope.invoiceId){
                    exit();
                }
            }
            $rootScope.jobEmailIcon = true;
        }
        if(statusName.id == 5){
            $scope.blankOverlay = true;
        }
        $(".mainContent").addClass("not-loading");  
        $scope.statusName = statusName.statusName;
        $scope.statusId = statusName.id;
        $scope.oneJobModel.job.jobStatus = statusName.id;
        if (statusName.id === 5) {
            $scope.blankOverlay = true;
        } else {
            $scope.blankOverlay = false;
        }
        if($scope.statusId == 4){
            $scope.statusComplete = true;            
            $rootScope.jobEmailIcon = true;
        } else {
            $scope.statusComplete = false;
        }
        if(statusName == "Not Started"){
            $scope.jobStatusClass = "not-started";
            $scope.jobStatusIcon = "jobstatus-icon1";
        } 
        if(statusName == "No Access"){
            $scope.jobStatusClass = "no-access";
            $scope.jobStatusIcon = "jobstatus-icon2";
        } 
        if(statusName == "In Progress"){
            $scope.jobStatusClass = "in-progress";
            $scope.jobStatusIcon = "jobstatus-icon3";
        } 
        if(statusName == "Completed"){
            $scope.jobStatusClass = "completed";
            $scope.jobStatusIcon = "jobstatus-icon4";
        } 
        if(statusName == "Closed"){
            $scope.jobStatusClass = "Closed";
            $scope.jobStatusIcon = "jobstatus-icon5";
        }  
        $scope.saveOneTimeJob();
        
        
        if($scope.statusId == 1 || $scope.statusId == 2 || $scope.statusId == 3){
            $rootScope.jobEmailIcon = false;
        }

        if($scope.statusId == 1 || $scope.statusId == 2 || $scope.statusId == 3 || $scope.statusId == 4){
            $scope.blankOverlay = false;
        }

}

$scope.selectwaterBodyOption = (selectwaterBodyId, selectwaterBody) => { 
    $scope.selectwaterBody = selectwaterBody
    $scope.waterBodyListId = selectwaterBodyId;
    $scope.saveOneTimeJob();
    $scope.saveOneTimeJobItem();
    var waterBody = {
        id: $scope.waterBodyListId,
        waterBodyName: $scope.selectwaterBody      
    }
    $rootScope.getEquipmentDetails(waterBody)
}

$scope.selectTimeOption = (jobTimeId) => { 
    $scope.selectTime = jobTimeId.period;
    $scope.selectTimePeriod = jobTimeId.period+' '+ (jobTimeId.startTime ? jobTimeId.startTime + ' - ' : '')+ (jobTimeId.endTime ? jobTimeId.endTime : '');
    $scope.jobTimeId = jobTimeId.id;
    $scope.saveOneTimeJob();
    $scope.saveOneTimeJobItem();
}

$scope.selectPayOption = (payOption) => {
    $scope.payOptionValue = payOption.option;
    $scope.payId = payOption.id;
    $scope.saveOneTimeJob();
    $scope.saveOneTimeJobItem();
}

$scope.selectTax = (companyId,index) => { 
    // if (companyId.title && companyId.amount) {
        $scope.taxRemovedByUser = false;
        $scope.taxTitle = companyId.title;
        $scope.taxPercentValue  = companyId.amount;
        let taxValue = ($scope.getSubtotalForTax(index))*($scope.taxPercentValue)/100;
        $scope.taxValue = taxValue;
        $scope.bundleTotal = ($scope.bundleSubTotal-$scope.discountCalculation)+$rootScope.negativeRoundUp($scope.taxValue);
        $scope.saveOneTimeJobItem();
    // }
}

$scope.templateNameOption = (templateNameNew) => {
    if (templateNameNew && templateNameNew.subTotalAmount < 0) {
        $scope.errorProductForm = "The job total can't be less than $0.00";
        setTimeout(function() {
            $scope.errorProductForm  = "";
        }, 2000);
        return;
    }
    $scope.templateCheckboxes = [
        { label: 'Checklist Item Workflow', value: false },
        { label: 'Products/Services', value: false },
        { label: 'Job Title', value: false },
        { label: 'Job Duration', value: false },
        { label: 'Tech Instructions', value: false },
        { label: 'Office Notes', value: false },
    ];
    $scope.templateNameNew = templateNameNew.templateName;
    $scope.templateId = templateNameNew.id;
    $scope.selectedTemplateName = templateNameNew;
    $scope.onPageLoad = 0;
    $scope.addProductPopup = ngDialog.open({
        template: 'templateConfirm.html',
        className: 'ngdialog-theme-default v-center',
        scope: $scope,
        preCloseCallback: function() {
            $scope.productEdit = false;
        }
    });
}

$scope.toggleAllTemplateCheckBox = function() {
    let newVal = !$scope.isAllTemplateCheckBoxesChecked();
    angular.forEach($scope.templateCheckboxes, function(checkbox) {
        checkbox.value = newVal;
    });
};
$scope.isAllTemplateCheckBoxesChecked = function() {
    return $scope.templateCheckboxes.every(chk => chk.value === true);
};
$scope.isConfirmButtonDisabled = function () {
    return !$scope.templateCheckboxes.some(function (checkbox) {
      return checkbox.value === true;
    });
  };

$scope.templateNameOptionConfirm = function(){  
    const overwriteSections = $scope.templateCheckboxes.filter(item => item.value).map(item => item.label).join(', ');
    $scope.templateNameNew = $scope.selectedTemplateName.templateName;
    $scope.templateId = $scope.selectedTemplateName.id;
    var templateNameNew = $scope.templateId;
    $scope.onPageLoad = 0;
    apiGateWay.get("/job_by_template", {
        jobId: $scope.jobId,
        tempateId: $scope.selectedTemplateName.id,
        addressId: $scope.addressId,
        actionPerformed: 'changed_template',
        changed_template_name: $scope.templateNameNew,
        overwriteSections: overwriteSections
    }).then(function(response) {            
        if (response.data.status == 200) {    
            $scope.oneTimeJob();
            $rootScope.getChecklistForTemplate(templateNameNew);
            ngDialog.close();
        } else {
            $scope.productNoItem = true;               
        }
    });    
}

$scope.addDiscount = function() {        
    $scope.addProductPopup = ngDialog.open({
        template: 'addDiscount.html',
        className: 'ngdialog-theme-default v-center',
        scope: $scope,
        closeByEscape: $scope.productEdit,
        closeByDocument: $scope.productEdit,
        preCloseCallback: function() {
            $scope.productEdit = false;
        }
    });
};
$scope.showDiscountValue = function(discountValue) {  
    $scope.discountValue = discountValue;
    if($scope.discountValue){
        if($scope.discountType == '%'){
            $scope.discountCalculation = ($scope.bundleSubTotal*$scope.discountValue)/100;
            let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
            $scope.bundleTotal = bundleTotal + $rootScope.negativeRoundUp($scope.taxValue); 
            $scope.discountTitle = $scope.discountValue+$scope.discountType;
            $scope.updateTaxes();
        } else {
            discountCalculation = ($scope.bundleSubTotal-$scope.discountValue)+ $rootScope.negativeRoundUp($scope.taxValue); 
            $scope.discountCalculation = $scope.discountValue;
            $scope.bundleTotal = discountCalculation;
            $scope.updateTaxes();
        }
    }
}

$scope.addTaxJob = function(){
    ngDialog.close();
    let taxValue = ($scope.getSubtotalForTax())*$scope.taxPercentValue/100;
    $scope.taxValue = taxValue;
    if($scope.bundleTotal.toFixed(2) >= 0){
        let discountCalculation = $scope.discountCalculation;
        $scope.saveOneTimeJob();
        $scope.saveOneTimeJobItem(discountCalculation); 
    } else {
        if($scope.discountType == '%'){
            $scope.discountCalculation = ($scope.bundleSubTotal*$scope.discountValue)/100;
            let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
            $scope.bundleTotal = bundleTotal + $rootScope.negativeRoundUp($scope.taxValue); 
            $scope.discountTitle = $scope.discountValue+$scope.discountType;
            $scope.saveOneTimeJob();
            $scope.saveOneTimeJobItem($scope.discountCalculation);
        } else {
            $scope.errorDiscount = true;
            $scope.discountValue = 0;
            discountCalculation = $scope.bundleSubTotal-$scope.discountValue+$rootScope.negativeRoundUp($scope.taxValue); 
            $scope.discountCalculation = $scope.discountValue;
            $scope.bundleTotal = discountCalculation;
            setTimeout(function() {
                $scope.errorDiscount = false;
            }, 2000); 
        }        
    }
}

$scope.updateDiscountType = function(value){
    $scope.discountType = value;
    if($scope.discountType == '%'){
        let discountCalculation = $scope.bundleSubTotal*$scope.discountValue/100;
        $scope.discountCalculation = discountCalculation;
        let bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation+$rootScope.negativeRoundUp($scope.taxValue); 
        $scope.bundleTotal = bundleTotal;
    } else {
        if($scope.discountValue){            
            discountCalculation = $scope.bundleSubTotal-$scope.discountValue+$rootScope.negativeRoundUp($scope.taxValue); 
            $scope.discountCalculation = $scope.discountValue;
            $scope.bundleTotal = discountCalculation;
        }
    }
}

$scope.removeDiscount = function(){
    
    $scope.discountValue ="";
    $scope.discountCalculation = $scope.bundleSubTotal*$scope.discountValue/100;
    let taxValue = ($scope.getSubtotalForTax()) * $scope.taxPercentValue/100
    $scope.taxValue = taxValue;
    $scope.bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation+$rootScope.negativeRoundUp($scope.taxValue); 
    $scope.discountTitle = "";
    $scope.updateTaxes();
    $scope.saveOneTimeJobItem();  
}

$scope.discountValueChange= function(){
    
    
 }
 $scope.taxRemovedByUser = false;
$scope.removeTax = function(){
    $scope.taxTitle = "";
    $scope.taxPercentValue  = 0;
    $scope.taxValue = ($scope.bundleSubTotal-$scope.discountCalculation)*$scope.taxPercentValue/100;
    $scope.bundleTotal = ($scope.bundleSubTotal-$scope.discountCalculation)+$rootScope.negativeRoundUp($scope.taxValue);
    $scope.taxRemovedByUser = true;
    // angular.forEach($scope.productBundleListNew, (element, index) => {
    //     if (element.isChargeTax == 1 && element.category !== 'Bundle') {
    //         element.isChargeTax = 0
    //     }
    //     if (element.bundleItemReference && element.bundleItemReference.length) {
    //         angular.forEach(element.bundleItemReference, (element2, index2) => {
    //             if (element2.isChargeTax == 1) {
    //                 element2.isChargeTax = 0
    //             }
    //         });
    //     }
    // });
    $scope.saveOneTimeJobItem();
}

$scope.closeTaxJob = function(){
    ngDialog.close();
    $scope.discountValue = 0;
	$scope.discountTitle = "";		  
    $scope.discountCalculation = $scope.bundleSubTotal*$scope.discountValue/100;
    $scope.bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation;   
}

$rootScope.deleteJob = function(jobId){
    $scope.isProcessing = true;
    apiGateWay.send("/delete_job", {
        "jobId": jobId
    }).then(function(response) {
        if (response.data.status == 200) {
            $scope.changeStatus($scope.addressId);
            ngDialog.close();
            $state.go("app.customerdetail", {
                addressId: $scope.addressId
            });
        }
        $scope.isProcessing = false;
    }, function(error){
        $scope.isProcessing = false;
    })
};

$scope.changeStatus = function (addressId) {
    $scope.isChangingStatus = true;
    apiGateWay.get("/customer/change_status", {'addressId': addressId }).then(function(response) {
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

$rootScope.deleteJobConfirm = function(jobId){
    $scope.jobId  = jobId       
    ngDialog.open({            
        id  : 11,
        template: 'deleteJobConfirm.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function () {
            
        }
    });
}

apiGateWay.get("/company_billing_settings").then(function(response) {
    if (response.data.status == 200 && response.data.data) {
        $scope.billingSetting = response.data.data.activateBilling; 
    } else {
        $scope.billingSetting = '';
    }
},function(error){
    $scope.billingSetting = '';
})

$scope.showBillingMsg = function($scope){
    ngDialog.open({
    template: 'showBillingMsg.html',
    className: 'ngdialog-theme-default v-center',
    scope: $scope,
    });  
}

$scope.closeBillingMsg = function(){
    ngDialog.close();
}
$rootScope.selectedJobIdForRecreateInvoice = 0;
$rootScope.invoiceAlreadyCreatedModal;
$rootScope.checkJobInvoice = function(jobId){
    if ($scope.invoiceId && $scope.invoiceId != '') {
        $rootScope.selectedJobIdForRecreateInvoice = jobId;
        $rootScope.invoiceAlreadyCreatedModal = ngDialog.open({
            template: 'confirmRecreateInvoice.html',
            className: 'ngdialog-theme-default',
            overlay: true,
            closeByDocument: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $rootScope.selectedJobIdForRecreateInvoice = 0;                                  
            }
        });
    } else {        
        $rootScope.createJobInvoice(jobId);
    }    
}
$rootScope.closeInvoiceAlreadyCreatedModal = function(){        
    $rootScope.invoiceAlreadyCreatedModal.close()    
};
$rootScope.closeJobWithoutJobCreation = () => {
    var statusNameObj = {statusName: 'Closed', id: 5}
    $scope.selectJobStatus(statusNameObj, true)
}
$rootScope.createJobInvoice = function(jobId){  
    if ($rootScope.invoiceAlreadyCreatedModal) {
        $rootScope.closeInvoiceAlreadyCreatedModal();  
    }    
    $scope.statusComplete = false;
    $scope.$parent.statusComplete = false;
    if ($scope.productBundleListNew.length > 0){
        if($scope.billingSetting) {
            $scope.isProcessing = true;
            apiGateWay.send("/create_one_job_invoice", {
                "jobId": jobId
            }).then(function(response) {
                if (response.data.status == 201) { 
                    $scope.oneTimeJob();
                    invoceCreatedOn = response.data.data.createdOn;
                    $scope.invoceCreatedOn = moment(invoceCreatedOn).format('MM/DD/YYYY');
                    $scope.invoceid = response.data.data.invoiceId;
                    //Sync job status via socket
                    try{
                        var jobInfo = $scope.oneJobModel.job;
                        var statusJson = {
                            oneOfJobId: jobInfo.jobId, 
                            addressId: jobInfo.addressId, 
                            date: moment($scope.assignRouteDate).format('YYYY-MM-DD').toString(), 
                            status: "Closed", 
                            companyId: auth.getSession().companyId
                        };
                        $rootScope.socket.emit('refreshRouteJobStatus', statusJson)
                        
                    }catch(e){

                    }
                } else {
                    $scope.errorProductForm = response.data.message ? response.data.message : 'Error';
                    setTimeout(function() {
                        $scope.errorProductForm = "";
                    }, 2000); 
                }
                $scope.isProcessing = false;
            }, function(error){
                $scope.isProcessing = false;
            })
        } else  {
            // $scope.showBillingMsg($scope)
            var statusNameObj = {statusName: 'Closed', id: 5}
            $scope.selectJobStatus(statusNameObj, true)
        }
    } else {
        var statusNameObj = {statusName: 'Closed', id: 5}
        $scope.selectJobStatus(statusNameObj)
    }
};
//end one of job data


    $scope.onExit = function() {
        $rootScope.addUpdateManager("remove", $scope.jobId);
        
        /* if($state.current.name == 'app.customerjobdetail'){
          return false;
        } */
        return;
    };
    $scope.$on("$destroy", function () {
        $rootScope.getJobDetailByWaterBody = null;
        $scope.jobId = '';
        $rootScope.jobId = '';
        $rootScope.jobIdForOneTimeJob = '';
        $rootScope.customerDetails = {};
        $rootScope.primaryEmail = '';   
        $rootScope.customer = {};
    })

    $scope.downloadFile = function(url){
        var fileName = url.substr(url.lastIndexOf("/")+1);
            var imageUrl = url;
            var tag = document.createElement('a');
            tag.href = imageUrl;
            tag.download = fileName;
            tag.setAttribute('target','_blank');
            document.body.appendChild(tag);
            tag.click();
            document.body.removeChild(tag);
    }

    $scope.displayAsMultiLine = function(issObj){
      var noteStr = issObj.description;
      var finalText = issObj.description ? issObj.description : '';
      if(issObj.time){
        finalText += ' ' + issObj.time;
      }
      return finalText;

    }

    var crowlerPlaceHolderImages = [{
        assetsType:"No Image",
        fileName:"No Image",
        filePath:"https://uat.tritontracking.com/admin/resources/images/no-sync-image.jpg",
        image:"https://uat.tritontracking.com/admin/resources/images/no-sync-image.jpg",
        filetype:"image"
    }];

    var actionName = "";
    actionName += "Page - Job Overview\n";
    actionName += "Action - Job Overview page opened\n";
    $rootScope.addAuditLog($scope.jobId, actionName);
    $window.onbeforeunload = $scope.onExit;
    //to show sensor in dialog
    $scope.showSensor = function() {
        ngDialog.open({
            template: 'sensor.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };

    $scope.updateDiscounts();
    $scope.updateTaxes();
    $scope.toggleConfirm = function() {
        $scope.overRide = false;
        if (!$scope.confirmOpen) {
            $scope.confirmOpen = true;
        } else {
            $scope.confirmOpen = false;
        }
    };
    $scope.toggleOverRide = function() {
        $scope.confirmOpen = false;
        if (!$scope.overRide) {
            $scope.overRide = true;
        } else {
            $scope.overRide = false;
        }
    };
    $scope.dateRangeModel = {
        graphFromDate: "",
        graphToDate: ""
    }

    //to show pictures in dialog
    $scope.showPicturesVideos = function(event, type) {

      if(event.target.tagName.toLowerCase() == "i"){
          event.preventDefault();
          return;
      }
      $scope.navigateToJobImages();
      return
    };

    $scope.navigateToJobImages = function(){
        $state.go('app.customerjobimages', {
            jobId: $scope.jobId
        });
    }


    //to show note in dialog
    $scope.showNote = function(note) {
        $scope.note = note;
        var actionName = "";
        actionName += "Page - Job Overview\n";
        actionName += "Action - Job activity note viewed\n";
        $rootScope.addAuditLog($scope.jobDetails.jobId, actionName);
        ngDialog.open({
            template: 'note.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    //to show activity pictures in dialog
    $scope.activityPictures = {};
    $scope.showActivityPictures = function(activity) {
        var images = activity.images.length > 0 ? activity.images : crowlerPlaceHolderImages;
        $scope.alertPictures = images;
        $scope.activityTitle = activity.title;
        var actionName = "";
        actionName += "Page - Job Overview\n";
        actionName += "Action - Job activity pictures viewed\n";
        $rootScope.addAuditLog($scope.jobDetails.jobId, actionName);
        ngDialog.open({
            template: 'alertPictures.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    $scope.alertPictures = {};
    //to show alerts pictures in dialog
    $scope.showAlertPictures = function(images) {
        images = images.length > 0 ? images : crowlerPlaceHolderImages;
        $scope.alertPictures = images;

        var actionName = "";
        actionName += "Page - Job Overview\n";
        actionName += "Action - Job alert pictures viewed\n";
        $rootScope.addAuditLog($scope.jobDetails.jobId, actionName);
        ngDialog.open({
            template: 'alertPictures.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });
    };
    $scope.installDetail = {};
    $scope.jobSensor = {};
    $scope.isInstall = false;


    $scope.saltSystemData = {
        "active": "Active Salt System",
        "present": "Present but Non-Functional",
        "no": "No Salt System"
    };

     //to get customer information
    $scope.checkListArray = [];
    $scope.serviceLevelArray = [];
    $scope.assignedSL = '';
    $scope.getCustomerInfo = function() {
        
        // $scope.isProcessing = true;
        var pdata = {
            addressId: $scope.addressId,
            filterMonth: $scope.filterModel.filterMonth,
            jobId: $scope.jobId
        };
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            pdata.startDate = $filter('date')(new Date($scope.dateRangeModel.graphFromDate), 'yyyy-MM-dd');
            pdata.endDate = $filter('date')(new Date($scope.dateRangeModel.graphToDate), 'yyyy-MM-dd');
        }
        apiGateWay.get($rootScope.customerDetailEndpoint, pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    $scope.customerinfo = response.data.data;
                    $scope.installDetail = $scope.customerinfo.installDetail;
                    $scope.installDetail.gallonage = $scope.customerinfo.installDetail.gallonage ? $scope.customerinfo.installDetail.gallonage : null;

                    $scope.installer = $scope.customerinfo.installer;
                    $scope.jobSensor = $scope.customerinfo.jobSensorData;
                    $scope.isInstall = (Object.keys($scope.installDetail).length > 0 && $scope.installDetail.gallonage) ? true : false;
                    ;            
                  
                } else {
                    $scope.customerinfo = [];
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
            
        });
        var pdata2 = {
            addressId: $scope.addressId,
            filterMonth: $scope.filterModel.filterMonth
        };
        pdata2.type = "technician";
        pdata2.jobId = $scope.jobId;
        // $scope.isProcessing = true;
        //$scope.getJobDetails($scope.jobId, {});
    };

    


    $scope.jobStartTimeOnBlur = function(value){
       let inputValue = $('.startJobInput').val();
       $(".startJobInput").parent().removeClass('timeOpen');
        if($(".bootstrap-datetimepicker-widget").length==0 && $scope.jobActivityTime['startDate'].time._i && moment($scope.jobActivityTime['startDate'].time._i).format('DD-MM-YYYY   hh:mm a') != inputValue){
            $scope.activitychanged = true;
           // $scope.jobActivityTime['startDate'].time = value;
            $scope.submitJobUpdateTime('startDate');
        }    
    }
    $scope.jobEndTimeOnBlur = function(value){
        let inputValue = $('.endJobInput').val();
        $(".endJobInput").parent().removeClass('timeOpen');
        if($(".bootstrap-datetimepicker-widget").length==0 && $scope.jobActivityTime['endDate'].time._i && moment($scope.jobActivityTime['endDate'].time._i).format('DD-MM-YYYY   hh:mm a') != inputValue){
            $scope.activitychanged = true;
        //    $scope.jobActivityTime['endDate'].time = value;
            $scope.submitJobUpdateTime('endDate');
        }
    }
    $scope.startDateTimeOpen = function(){
        if($(".bootstrap-datetimepicker-widget").length!=0){
            $(".startJobInput").parent().addClass('timeOpen');
        }else{
            $(".startJobInput").parent().removeClass('timeOpen');
        }
        
    }
    $scope.endDateTimeOpen = function(){
        if($(".bootstrap-datetimepicker-widget").length!=0){
            $(".endJobInput").parent().addClass('timeOpen');
        }else{
            $(".endJobInput").parent().removeClass('timeOpen');
        }
    }
     var intervalIns = '';
    $scope.submitJobUpdateTime = function(field){
        if(intervalIns){ clearTimeout(intervalIns);}
        intervalIns = setTimeout(function(){
                let timeInstance = $scope.jobActivityTime[field].time;
                let datestr = moment(timeInstance.toDate()).format('YYYY-MM-DD HH:mm:ss');
                let jobTrackingId = $scope.jobActivityTime[field].trackingId;
                let lastTime = moment($scope.lastActivityTime[field]).format('YYYY-MM-DD HH:mm');
                let currentTime = moment(timeInstance.toDate()).format('YYYY-MM-DD HH:mm');
                if(currentTime != lastTime){
                   
                    apiGateWay.send("/job_date_update", {
                            "newDate": datestr, 
                            "installerTrackingId": jobTrackingId,
                            "jobId": $scope.jobActivityTime.jobId
                        }).then(function(response) {
                            if (response.data.status == 200) {
                                $scope.getInstallHistory($scope.installer.installerId, $scope.subJobId); 
                            }    
                            
                        }, function(error){
                            $scope.jobActivityTime[field].time = $scope.lastActivityTime[field];
                            $scope.timeError = error;
                            $scope.isProcessing = false;
                            setTimeout(function() {
                                $scope.timeError = '';
                                $scope.isProcessing = false;
                            }, 5000);
                        })
                }
            }
        , 100)
    };

    $scope.jobDateLogs = function(sJobId,jobHistory, startTime){
        
        $scope.jobActivityTime.currentDate =  startTime;
        $scope.startJobLog = [];
        $scope.endJobLog = [];     
        $scope.jobActivityTime.jobId = sJobId;   
        $scope.jobActivityTime['startDate'].isUpdated = false;
        $scope.jobActivityTime['endDate'].isUpdated  = false;

        $scope.jobActivityTime['startDate'].time = '';
        $scope.jobActivityTime['endDate'].time = '';
        angular.forEach(jobHistory, function(value, key) {
            if(value.title=="Start Job"){
                let jodStartDateStr =value.createTime.replace('Z','');
                $scope.jobActivityTime['startDate'].time = jodStartDateStr; 
                $scope.lastActivityTime['startDate'] = jodStartDateStr;
                $scope.jobActivityTime['startDate'].trackingId = value.installerTrackingId;
                //let maxTime=jobHistory[key+1].createTime;
                //$scope.startTimePickerOption.maxDate = $filter('date')(new Date(maxTime), "hh:m:ss a");
            }
            if(value.title=="Job Finished"){
                let jodEndDateStr = value.createTime.replace('Z','');
                $scope.jobActivityTime['endDate'].time = jodEndDateStr; 
                $scope.lastActivityTime['endDate'] = jodEndDateStr;
               
                $scope.jobActivityTime['endDate'].trackingId = value.installerTrackingId;
                //minTime=jobHistory[key-1].createTime;
                //$scope.endTimePickerOption.minDate = $filter('date')(new Date(minTime), "hh:m:ss a");
            }

        });

        apiGateWay.get("/job_date_logs?jobId="+$scope.jobActivityTime.jobId).then(function(response) {  
            if (response.data.status == 200) {
                let responseData = response.data.data;
               angular.forEach(responseData, function(editLog) {
                    if($scope.jobActivityTime['startDate'].trackingId == editLog.installerTrackingId && editLog.newDate != editLog.oldDate){
                        $scope.jobActivityTime['startDate'].isUpdated = true;
                        editLog.createTime = moment(editLog.createTime).local().format();
                        $scope.startJobLog.push(editLog);
                    }
                    if($scope.jobActivityTime['endDate'].trackingId == editLog.installerTrackingId && editLog.newDate != editLog.oldDate){
                        $scope.jobActivityTime['endDate'].isUpdated = true;
                        editLog.createTime = moment(editLog.createTime).local().format();
                        $scope.endJobLog.push(editLog);
                    }
                 }); 
            }
        }, function(error){
        });

       
    };
    


    $scope.confirmChecklistAction = function(checkListObj, index){
        $scope.isProcessing = true;
        ngDialog.closeAll()
        apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.checkListArray.splice(index, 1);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }

    //to save install detail
    $scope.saveInstall = function() {
        $scope.isProcessing = true;
        var params = angular.copy($scope.activityModel);
        params['saltSystem'] = params['saltSystem'] ? 'active' : 'no';
        var activityModel = $scope.activityModel;
        apiGateWay.send("/installer_details", {
            "postData": params
        }).then(function(response) {
            if (response.data.status == 201) {
                //$scope.getInstallHistory($scope.installer.installerId, $scope.activityModel.jobId);
                $scope.error = '';
                $scope.installDetail.gallonage = $scope.activityModel.gallanogeCalculated || $scope.activityModel.gallanogeCalculated == 0 ? parseFloat($scope.activityModel.gallanogeCalculated) : null;
                $scope.installDetail.installerTrackingId = $scope.activityModel.galId;
                $scope.installDetail.saltSystem = $scope.activityModel.saltSystem;

                if($scope.activityModel && !$scope.activityModel.jobId){
                    $scope.getCustomerInfo();
                }
                $scope.successMsg = response.data.message;
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
                var analyticsData = {};
                analyticsData.requestData = $scope.activityModel;
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = response.data;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Save Install', "Error on saveInstall - " + currentDateTime, analyticsDataString, 0, true);
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
            }, 2000);
        }, function(error) {
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            var analyticsData = {};
            analyticsData.requestData = $scope.activityModel;
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics('Error - Save Install', "Error on saveInstall - " + currentDateTime, analyticsDataString, 0, true);
            $scope.successMsg = '';
            $scope.error = msg;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
            }, 2000);
        });
    }

    $scope.activityModel = {
        "galId": 0,
        "saltId": 0,
        "jobId": "",
        "gallanogeCalculated": null,
        "saltSystem": "",
        "addressId": $scope.addressId
    }

    $scope.updateJobType=function(){
        $scope.isProcessing = true;
        var jobType = $scope.activityModel.jobType ? "chemical" : "complete";
        var jobTypeModel = {"jobType":jobType,"addressId":$scope.addressId}
        apiGateWay.send("/address_sync", jobTypeModel).then(function(response) {
            if (response.data.status == 201) {
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


    //update selected jobId, and update section on the basis of selected Job ID 
    $scope.initJobDetails = true;
    $rootScope.getJobDetailByWaterBody = function(watebodyId) {  
       
        $scope.subJobId = $scope.jobId;          
        $rootScope.initGraphArea($scope.addressId, $scope.waterBodyId, $scope.subJobId, 'oneTimeJob');
        if($scope.subJobId){
            $scope.jobImages($scope.subJobId)
            $scope.getChemicalInput($scope.subJobId) 
            $scope.getChemicalReading($scope.subJobId)     
     
            if($scope.initJobDetails){
        
                $scope.getJobDetails($scope.subJobId, {}, true);                
            } 
            $scope.noJobDataAvailable = '';
        }  else {
            $scope.noJobDataAvailable = 'No job data to show for this body of water';
        } 
        $scope.initJobDetails = true;
              
    }
    $scope.customerNotes = {
        confirmNote: ''
    };
    $scope.customerNotesCache = angular.copy($scope.customerNotes);
    $scope.customerNotesError = '';
    $scope.customerNotesProcessing = false;
    $scope.customerNotesPayload = {};
    $scope.getInstallHistory = function(installerId, jobId) {
        // $scope.isProcessing = true;
        $scope.customerNotes = {
            confirmNote: ''
        };
        $scope.customerNotesCache = angular.copy($scope.customerNotes);
        var pdata = {
            addressId: $scope.addressId,
            installerId: installerId,
            jobId: jobId,
            type: "technician",
        };      
        $scope.customerNotesPayload = pdata;   
        apiGateWay.get("/installer_history", pdata).then(function(response) {
            var responseData;
            if (response.data) {
                if (response.data.status == 200) {
                    
                    responseData = response.data.data;
                    if (responseData.totalMinutes && responseData.totalMinutes.includes('mins')) {
                        responseData.totalMinutes = $rootScope.calculateMins(responseData.totalMinutes)
                    }
                    $scope.installerHistory = responseData;
                    $scope.instHistory = responseData.instHistory;
                    $scope.installNotes = responseData.installNotes;
                    if (responseData.customerNotes && responseData.customerNotes.length > 0) {
                        $scope.customerNotes = responseData.customerNotes[0];
                        $scope.customerNotesCache = angular.copy($scope.customerNotes);
                    }

                    $scope.totalMinutes = responseData.totalMinutes;
                    $scope.startDate = responseData.startDate;
                    let jobDetails = $scope.jobDetails;                    
                    jobDetails.activityHistory = $scope.instHistory;

                    service.jobDetails[jobDetails.jobId].activityHistory = jobDetails.activityHistory;
                    $scope.jobDetails = jobDetails;
                    $scope.parseJobDetails(jobDetails);
                    $scope.jobDateLogs(Number(pdata.jobId), $scope.instHistory,$scope.installerHistory.startDate);

                } else {
                    
                    $scope.customerinfo = [];
                    var analyticsData = {};
                    
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
        });
    }  
    $scope.updateCustomerNotes = function() {
        if ($scope.customerNotes.confirmNote == $scope.customerNotesCache.confirmNote) {
            return
        }
        $scope.customerNotesProcessing = true;        
        var pdata = {
            addressId: Number($scope.addressId),
            jobId: Number($scope.customerNotesPayload.jobId),
            installerId: $scope.customerNotesPayload.installerId,
            type: $scope.customerNotesPayload.type,
            alertId: $scope.customerNotes.alertId,
            altertType: 'CustomerNotes',
            confirmNote: $scope.customerNotes.confirmNote,
            imageCaption: $scope.customerNotes.imageCaption,
            status: $scope.customerNotes.status,
            action: $scope.customerNotes.alertId ? 'update' : 'add',
        };
        apiGateWay.send("/installer_history", pdata).then(function(response) {
            if (response.data && response.data.status == 200) {
                let responseData = response.data.data;
                if (responseData.customerNotes && responseData.customerNotes.length > 0) {
                    $scope.customerNotes = responseData.customerNotes[0];
                    $scope.customerNotesCache = angular.copy($scope.customerNotes);
                }
            } else {
                $scope.customerNotesError = response.data && response.data.message ? response.data.message : 'Something went wrong';
            }
            $scope.customerNotesProcessing = false;
            $timeout(()=>{ $scope.customerNotesError = ''} ,2000);
        }, function(error) {
            $scope.customerNotesError = typeof error == 'string' ? error : 'Something went wrong';
            $timeout(()=>{ $scope.customerNotesError = ''} ,2000);
            $scope.customerNotesProcessing = false;
        });
    }
    $scope.getChemicalReading = function(subJobId) {
        $scope.chemicalReading = {};
        if (subJobId) {
            apiGateWay.get("/chemicals_reading", {
                jobId: subJobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        $scope.chemicalReadingUnit = response.data.data['chemical_unit'];
                        if(response.data.data['chemical_readings'].length > 0){
                            $scope.chemicalReading = angular.copy(response.data.data['chemical_readings'][0]);                          
                            
                            angular.forEach($scope.chemicalReading, function(value, key) {
                                var t = key + "_defaultValue"
                                if ($scope.chemicalReading[t] != undefined) {
                                    if(typeof value === 'string'){
                                        $scope.chemicalReading[key] = parseFloat(value)
                                    }
                                    if (value == -1 || value == -1.0 || value == "-1.0") {
                                        $scope.chemicalReading[key] = null;
                                    }
                                    
                                }
                            });
                        }
                        $scope.chemicalReadingDefault = angular.copy($scope.chemicalReading);
                        $scope.getChemicalReadingLogs(subJobId, response.data.data['chemical_readings'][0])                      
                    }
                }
            }, function(error) {
            });
        }
    }
    $scope.getChemicalClassName = function(chemicalType, logs) {
        let chemicalClass = '';
        if (chemicalType && chemicalType == 'Lamotte') {           
            if (logs !== 'noText'  && logs.includes('<br>')) {
                chemicalClass = 'has-updated';
            } else {
                chemicalClass = 'is-lamotte';
            }
        }
        if (chemicalType && chemicalType == 'Overwrite') {
            if (logs !== 'noText' && $scope.containsDate(logs)) {
                chemicalClass = 'has-updated';
            } else {
                chemicalClass = 'is-overwrite'
            }
        }
        if (chemicalType && chemicalType == 'Manual') {
            if (logs !== 'noText' && (logs.includes('<br>') || logs.includes('Changed to'))) {
                chemicalClass = 'has-updated';
            }
        }
        if (chemicalType && chemicalType == 'added') {
            if (logs && logs !== 'noText' && (logs.includes('<br>') || logs.includes('Changed to'))) {
                chemicalClass = 'has-updated';
            }
        }
        return chemicalClass;
    }
    $scope.getChemicalReadingLogs = function(subJobId, chemicalReading){
        //$scope.chemicalReadingLogs = [];
        if (subJobId) {
            apiGateWay.get("/chemicals_reading_logs", {
                jobId: subJobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        if(chemicalReading && Object.entries(chemicalReading).length > 0){
                            angular.forEach(chemicalReading, function(value, key) {
                                let tooltip = '';
                                let reading = response.data.data.filter(function(item, index){                               
                                    return item.chemicalName == key && item.value != "-1";
                                })
                                angular.forEach(reading, function(item,index){
                                if (item.isExistReading || item.isExistReading == null) {
                                    let noBreak = (index > 0 && tooltip == '') ? true : false;
                                    if (item.existValue == -1 || item.existValue == -1.0 || item.existValue == "-1.0" || item.existValue == "null" || !item.existValue) {                                   
                                        tooltip += 'Technician did not enter any value<br>';
                                    } else if ((item.existValue !== 'S' || item.existValue !== 'T' || item.existValue !== 'M') && item.existValue >= 0 && index == 0) {
                                        tooltip += 'Technician entered ' + item.existValue + '<br>';
                                    } else if (item.existValue === 'S') {
                                        tooltip += (index == 0 ? '' : '<br>' ) + 'Spintouch entered '+item.value;
                                    } else if (item.existValue === 'T' || item.existValue === 'M') {
                                        if (index != 0) {
                                            tooltip += '<br> Changed to '+parseFloat(item.value)+' by Technician';
                                        } else {
                                            tooltip += 'Technician entered '+parseFloat(item.value);
                                        }
                                    }
                                    
                                    let userDisplayName = item.updatedBy &&  item.updatedBy.length > 2 ? item.updatedBy : (item.firstName ? item.firstName : '') +' '+ (item.lastName && item.lastName.length > 1 ? item.lastName[0] + '.' : (item.lastName ? item.lastName : ''));
                                    userDisplayName = userDisplayName + (item.isApp ? ' (in app)' : '');
                                    if (item.existValue !== 'S' && item.existValue !== 'T' && item.existValue !== 'M') {
                                        if (item.value == -1 || item.value == -1.0 || item.value == "-1.0" || item.value == "null" || !item.value) {                                        
                                            tooltip += (index == 0 ? '' : '<br>') + 'Changed to blank by '+ userDisplayName +' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                        } else {
                                            tooltip += (index == 0 || noBreak ? '' : '<br>') + 'Changed to '+parseFloat(item.value)+' by ' +userDisplayName+' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                        }
                                    } else {
                                        if (item.value == -1 || item.value == -1.0 || item.value == "-1.0" || item.value == "null" || !item.value) {                                        
                                            tooltip += '<br>Changed to blank by '+ userDisplayName +' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                        } else {
                                            if (item.existValue === 'S' || item.existValue === 'T' || item.existValue === 'M') {
                                                // do nothing
                                            } else {
                                                tooltip += (noBreak ? '' : '<br>') + 'Changed to '+parseFloat(item.value)+' by ' +userDisplayName+' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                            }
                                        }
                                    }
                                  }
                                })
                                if(reading.length == 0){
                                    tooltip = 'noText';
                                }
                                $scope.chemicalReadingLogs[key] = tooltip;
                            });
                        }
                        angular.forEach($scope.chemicalStatus, function(value, parentIndex) {
                            let tooltip = '';
                            let reading = response.data.data.filter(function(item, index){                              
                                return item.chemicalName == value.keyName && !item.isExistReading && item.existValue !== 'M' && item.value != "-1";
                            })
                            angular.forEach(reading, function(item, index){  
                                if (item.existValue == -1 || item.existValue == -1.0 || item.existValue == "-1.0" || item.existValue == "null" || !item.existValue) {                                   
                                    tooltip += (index == 0 ? '' : '<br>' ) + 'Technician did not enter any value<br>';
                                } else if ((item.existValue !== 'S' || item.existValue !== 'T' || item.existValue !== 'M') && item.existValue >= 0 && index == 0) {
                                    tooltip += 'Technician entered ' + item.existValue + '<br>';
                                } else if (item.existValue === 'S') {
                                    tooltip += (index == 0 ? '' : '<br>' ) + 'Spintouch entered '+item.value;
                                } else if (item.existValue === 'T' || item.existValue === 'M') {
                                    if (index != 0) {
                                        tooltip += '<br> Changed to '+parseFloat(item.value)+' by Technician';
                                    } else {
                                        tooltip += 'Technician entered '+parseFloat(item.value);
                                    }
                                }
                                
                                let userDisplayName = item.updatedBy &&  item.updatedBy.length > 2 ? item.updatedBy : (item.firstName ? item.firstName : '') +' '+ (item.lastName && item.lastName.length > 1 ? item.lastName[0] + '.' : (item.lastName ? item.lastName : ''));
                                userDisplayName = userDisplayName + (item.isApp ? ' (in app)' : '');
                                if (item.existValue !== 'S' && item.existValue !== 'T' && item.existValue !== 'M') {
                                    if (item.value == -1 || item.value == -1.0 || item.value == "-1.0" || item.value == "null" || !item.value) {                                        
                                        tooltip += (index == 0 ? '' : '<br>') + 'Changed to blank by '+ userDisplayName +' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                    } else {
                                        tooltip += (index == 0 ? '' : '<br>') + 'Changed to '+parseFloat(item.value)+' by ' +userDisplayName+' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                    }
                                } else {
                                    if (item.value == -1 || item.value == -1.0 || item.value == "-1.0" || item.value == "null" || !item.value) {                                        
                                        tooltip += '<br> Changed to blank by '+ userDisplayName +' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                    } else {
                                        if (item.existValue === 'S' || item.existValue === 'T' || item.existValue === 'M') {
                                            // do nothing
                                        } else {
                                            tooltip += (index == 0 ? '' : '<br>') + 'Changed to '+parseFloat(item.value)+' by ' +userDisplayName+' - '+$filter('date')(item.createTime, "MM/dd/yyyy");
                                        }
                                    }
                                }
                            })
                            if(reading.length == 0){
                                tooltip = 'noText';
                            }
                            if ($scope.chemicalReadingLogs[value.keyName] != tooltip) {
                                $scope.chemicalReadingLogs[value.keyName+'_added'] = tooltip;
                            }
                        });
                        $scope.loadingChemical = true;
                    }
                }
            }, function(error) {
            });
        }
    }
    
    $scope.containsDate = function(str) {
        const dateRegex = /\b(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})\b/;
        // Check if the string matches the regex
        const match = str.match(dateRegex);
    
        if (match) {
            const dateStr = match[0];
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return true; // It's a valid date
            }
        }
        return false; // No valid date found     
    }
 
    /*$scope.openTooltip = function(e){
        if(e.target.querySelector('.e-tooltip')){            
            e.target.querySelector('.e-tooltip').style.top = e.target.offsetTop+'px';
            e.target.querySelector('.e-tooltip').style.left = e.target.offsetLeft+'px';
            $('body').append(e.target.querySelector('.e-tooltip'))
        }
       
    }*/

    $scope.validateCTabs = function(e, index){
        let n = String(e.target.value).split("."); 
        if (e.target.value.length == 4 && (n[0].length > 1 || n[1].length > 1)) {
            $scope.chemicalStatusModel.chemicalStatus[index].value = e.target.value.slice(0, -1);            
        }      
    }
  

    $scope.updateChemicals = function(type, name, value, existingValue){
        var isBothNull = (existingValue == null && value == null) ? true : false;
        var isDifferent = value != existingValue;
        value = '' + value;
        if(value.includes('.')) {
            var _valArr = value.split('.')
            var beforeDec = _valArr[0];
            var afterDec = _valArr[1];
            if(afterDec.length == 1) {
                afterDec = afterDec + '0'
            }
            value = beforeDec + '.' + afterDec
        }

        if(!isBothNull && isDifferent){
            if(type != 'reading' && ((existingValue == 0 && value == undefined) || (existingValue == undefined && value == 0)) ){ return false; }
            if($scope.loadingChemical){
                $scope.isProcessing = true;
            }
            let userId = $rootScope.userSession.id;
            if (value == undefined || value == 'undefined' || value == null || value == "null" || !value) {
                value = ''
            }
            let postData = {
                "value":value,
                "jobId":$scope.jobId,
                "chemicalName":name,
                "userId":userId,
                "isExistReading":type == 'reading' ? 1 : 0,
                "isAdmin": $scope.permissions.superAdmin ? $scope.permissions.superAdmin : 0
            }
            apiGateWay.send("/chemicals_reading_update", postData).then(function(response) {
                if (response.data.status == 200) {
                    $scope.getChemicalInput($scope.jobId) 
                    $scope.getChemicalReading($scope.jobId) 
                    $rootScope.initGraphArea($scope.addressId, $scope.waterBodyId, $scope.subJobId, 'oneTimeJob');
                }
                $scope.isProcessing = false;
            }, function(error){
              $scope.isProcessing = false;
            })
        }
        

    }
    $scope.confirmChecklistAction = function(checkListObj, index){
        $scope.isProcessing = true;
        ngDialog.closeAll()
        apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.checkListArray.splice(index, 1);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }

    // to store analytic data on close job
    $scope.closeJob = function(jobDetail) {
        var analyticsData = {};
        analyticsData.userData = $rootScope.userSession;
        analyticsData.data = jobDetail;
        analyticsData.actionTime = new Date();
        var analyticsDataString = JSON.stringify(analyticsData);
        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
        $rootScope.storeAnalytics('Jobs', "Jobs - Close Job - " + jobDetail.jobId + " - " + currentDateTime, analyticsDataString, 0, true);
    }
    $scope.overridenModel = [];
    $scope.hideAlertIssueIds = {
        "client": [],
        "system": []
    };
    //to submit override data
    $scope.submitOveride = function(overRideNote) {
        if (overRideNote) {
            $scope.isProcessing = true;
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                overideNote: overRideNote,
                issueType: $scope.openedIssueType,
                title: $scope.issueObj.title ? $scope.issueObj.title : $scope.issueObj.description,
                isConfirm: 0
            }).then(function(response) {
                
                

                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    jobId: $scope.openedJobId,
                    overRideNote: overRideNote,
                    issueId: $scope.selectedAlertIssueId
                };
                $scope.showDot[$scope.openedIssueType][$scope.selectedAlertIssueId] = false;

                $scope.successOveride = 'Alert has been overridden successfully';
                angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", true).addClass('disabledBtn');
                var isJobCompleted = response.data.data.isJobComplete;
                if (isJobCompleted) {
                    if (isJobCompleted == 1) {
                        if (response.data.data.jobDetail) {
                            $scope.closeJob(response.data.data.jobDetail);
                        }
                    }
                }
                if(typeof $rootScope.socket != 'undefined'){
                    var companyId = auth.getSession().companyId

                    $rootScope.socket.emit("checkPendingJobCount", {
                        companyId: companyId, 
                        alertType: $scope.openedIssueType, 
                        alertIssueId: $scope.selectedAlertIssueId, 
                        isJobCompleted: isJobCompleted, 
                        jobId: $scope.openedJobId
                    });
                }

                $scope.isProcessing = false;
                var actionName = "";
                var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                actionName += "Page - Job Overview\n";
                actionName += "Action - " + alertTitle + " alert overridden \n";
                //actionName += "Alert Type - " + $scope.openedIssueType + "\n";
                //var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                //var alertDesc = $scope.issueObj.description != undefined ? $scope.issueObj.description : $scope.issueObj.issueNote;
                //actionName += "Alert Title - " + alertTitle + "\n";
                //actionName += "Alert Description - " + alertDesc + "\n";
                $rootScope.addAuditLog($scope.jobId, actionName);
                $scope.alertTimeout = setTimeout(function() {
                    $scope.successOveride = '';
                    $scope.openedIssueType = '';
                    $scope.selectedAlertIssueId = '';
                    $scope.issueObj = "";
                    if (!$scope.$$phase) $scope.$apply();
                    $scope.alertTimeout = false;
                }, 2000);
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Override', "Alerts - Submit Override - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function(error) {
                $scope.errorOveride = error;
                var analyticsData = {};
                analyticsData.requestData = {
                    issueId: $scope.selectedAlertIssueId,
                    overideNote: overRideNote,
                    issueType: $scope.openedIssueType,
                    isConfirm: 0
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - submitOveride', "Error on Submit Override - " + currentDateTime, analyticsDataString, 0, true);
                setTimeout(function() {
                    $scope.errorOveride = '';
                }, 2000);
                $scope.isProcessing = false;
            });
        }
    };
    //to submit confirm data
    $scope.callConfirmSubmit = function(isDismissed) {       
        if(isDismissed && $scope.dismissAlertSetting.validateNotes && !$scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].customNote){
            $scope.dismissAlertSettingError = true;
           
            return false;
        }
        
        if ($scope.selectedAlertIssueId && $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail) {
            $scope.isProcessing = true;
            var confirmDetail = $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail;
            confirmDetail['isDismissed'] = isDismissed
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                isConfirm: 1,
                issueType: $scope.openedIssueType,
                confirmDetails: confirmDetail
            }).then(function() {
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    "jobId": $scope.jobId,
                    "confirmDetails": $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail,
                    "issueId": $scope.selectedAlertIssueId
                };

                service.jobDetails[$scope.jobDetails.jobId] = $scope.jobDetails;
                $scope.showDot[$scope.openedIssueType][$scope.selectedAlertIssueId] = !checkConfirmDetail(JSON.stringify($scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail));
                var Cond = 0;
                // angular.forEach($scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail, function(value, key) {
                //     if (value === true) {
                //         Cond++;
                //     }
                //     if (value === false) {
                //         Cond++;
                //     }
                // });

                if (isDismissed) {
                    var actionName = "";
                    var alertTitle = $scope.issueObj.title != undefined ? $scope.issueObj.title : $scope.setTitle($scope.issueObj.type);
                    actionName += "Page - Job Overview\n";
                    actionName += "Action - " + alertTitle + " alert confirmed\n";
                    $scope.addAuditLog($scope.jobId, actionName);
                    $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = "";
                    $scope.hideAlertIssueIds[$scope.openedIssueType][$scope.selectedAlertIssueId] = true;
                    //$scope.openedIssueType = '';
                    //$scope.selectedAlertIssueId = '';
                    $scope.issueObj['closeStatus'] = 1;
                    $scope.issueObj['confirmDetail'] = confirmDetail;                   
                    $scope.issueObj['managerName'] = $scope.serviceManagerName;
                    $scope.issueObj['managerFirstName'] = $scope.serviceManagerFirstName;
                    $scope.issueObj['managerLastName'] = $scope.serviceManagerLastName;
                    $scope.issueObj['managerImage'] = $scope.managerProfileImage;
                    $scope.getJobDetails($scope.jobId);
                    $scope.isProcessing = false;
                }else{
                    $scope.isProcessing = false;
                }

                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Confirm', "Alerts - Submit Confirm JobId - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function(error) {
                $scope.isProcessing = false;
                var analyticsData = {};
                analyticsData.requestData = {
                    issueId: $scope.selectedAlertIssueId,
                    isConfirm: 1,
                    issueType: $scope.openedIssueType,
                    confirmDetails: $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].confirmDetail
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - confirm submit', "Error on Submit Confirm - " + currentDateTime, analyticsDataString, 0, true);
            });
        }
    };
    $scope.chemicalCalculation = [];
    //to get chemical inputs of the job
    $scope.getChemicalInput = function(subJobId) {
        if (subJobId) {
            apiGateWay.get("/chemicals_input", {
                jobId:subJobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                      if (response.data.data['chemicalBalance'].length > 0) {
                          $scope.chemicalCalculation = response.data.data['chemicalBalance'];
                      }
                      if (response.data && response.data.data && response.data.data['chemicalStatus']) {
                          $scope.chemicalStatus = angular.copy(response.data.data['chemicalStatus']);
                          $scope.chemicalStatusDefault = angular.copy(response.data.data['chemicalStatus']);
                          $scope.chemicalStatusModel.chemicalStatus =  angular.copy(response.data.data['chemicalStatus']);
                      }
                      $scope.getChemicalCost($scope.waterBodyId);
                    }
                }
                
            }, function(error) {
            });
        }
    }
    $scope.confirmOpen = false;
    $scope.overRide = false;
    $scope.$watch('jobDetails.alertsIssueArray[openedIssueType][selectedAlertIssueId].overrideNote', function(o, n) {
        if (o != undefined) {
            angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", false).removeClass('disabledBtn');
        } else {
            angular.element(document.getElementById("btn" + $scope.selectedAlertIssueId)).prop("disabled", true).addClass('disabledBtn');
        }
    });
    //to set alert Title
    $scope.setTitle = function(alertType) {
        var selectedTabName = alertType;
        if (alertType == 'WaterLevelLow') {
            selectedTabName = 'Water Level Low';
        } else if (alertType == 'GreenPool') {
            selectedTabName = 'Algae';
        } else if (alertType == 'NoPower') {
            selectedTabName = 'No Power';
        } else if (alertType == 'SystemDown') {
            selectedTabName = 'System Down';
        } else if (alertType == 'NoAccess') {
            selectedTabName = 'No Access';
        } else if (alertType == 'Weather') {
            selectedTabName = 'Weather';
        } else if (alertType == 'RepairNeeded') {
            selectedTabName = 'Repair Needed';
        } else if (alertType == 'BrokenGauge') {
            selectedTabName = 'Broken PSI Gauge';
        } else if (alertType == 'MissingGauge') {
            selectedTabName = 'Missing PSI Gauge';
        }else if (alertType == 'Other') {
            selectedTabName = 'Other Issue';
        }
        return selectedTabName;
    };
    $scope.getAlertTabName = function(alertType) {       
        $scope.selectedTabName = '';
        if(alertType != 'BrokenGauge' || alertType != 'MissingGauge'){
            $scope.gaugeDescription = '';
        }
        
        if (alertType == 'WaterLevelLow') {
            $scope.selectedTabName = 'Water Level Low';
        } else if (alertType == 'GreenPool') {
            $scope.selectedTabName = 'Algae';
        } else if (alertType == 'NoPower') {
            $scope.selectedTabName = 'No Power';
        } else if (alertType == 'SystemDown') {
            $scope.selectedTabName = 'System Down';
        } else if (alertType == 'NoAccess') {
            $scope.selectedTabName = 'No Access';
        } else if (alertType == 'Weather') {
            $scope.selectedTabName = 'Weather';
        } else if (alertType == 'RepairNeeded') {
             $scope.selectedTabName = 'Repair Needed';
        } else if (alertType == 'Other') {
            $scope.selectedTabName = 'Other Issue';
        }else if (alertType == 'BrokenGauge') {
            $scope.selectedTabName = 'Broken PSI Gauge';
            $scope.gaugeDescription = "Technician is reporting that the pressure gauge for the main filtration pump is broken. The ability to obtain a proper PSI reading is necessary for flow monitoring";

        } else if (alertType == 'MissingGauge') {
            $scope.selectedTabName = 'Missing PSI Gauge';
            $scope.gaugeDescription = "Technician is reporting that the pressure gauge for the main filtration pump is missing/not present. The ability to obtain a proper PSI reading is necessary for flow monitoring";;
        }
        
        return $scope.selectedTabName;
    };
    $scope.openedIssueType = '';
    $scope.openedJobId = 0;
    //to display alert tabs on click
    $scope.alertTimeout = false;
    $scope.alertsIssueTabs = function(jobObj, issueObj, openedIssueType) {
      
        $scope.dismissAlertSettingError = false;
        if($scope.alertTimeout)
        {
            $scope.successOveride = '';
            clearTimeout($scope.alertTimeout);
            $scope.alertTimeout = false;
        }
        $scope.confirmOpen = false;
        $scope.overRide = false;
        $scope.openedIssueType = openedIssueType;
        $scope.issueObj = issueObj;
        if ($scope.issueObj != undefined) {
            $scope.selectedAlertIssueId = (openedIssueType == 'client') ? issueObj.alertIssueId : issueObj.systemIssueId;
        } else {
            $scope.selectedAlertIssueId = 0;
        }
        if (!$scope.openedJobId || $scope.openedJobId != jobObj.jobId) {
            if ($scope.actionFrom == 'iconClick') {
                var actionName = "";
                var alertTitle = issueObj.title != undefined ? issueObj.title : $scope.setTitle(issueObj.type);
                actionName += "Page - Job Overview\n";
                actionName += "Action - " + alertTitle + " alert expanded\n";
                $rootScope.addAuditLog(jobObj.jobId, actionName);
            }
            $scope.openJobDetails(jobObj, 'iconClick');
        } else {
            if ($scope.actionFrom == 'iconClick') {
                var actionName = "";
                var alertTitle = issueObj.title != undefined ? issueObj.title : $scope.setTitle(issueObj.type);
                actionName += "Page - Job Overview\n";
                actionName += "Action - " + alertTitle + " alert expanded\n";
                $rootScope.addAuditLog(jobObj.jobId, actionName);
            }
        }
    };
    $scope.openJobDetails = function(jobObj, actionFrom) {
        $scope.actionFrom = actionFrom || 'direct';
        var jobId = jobObj.jobId;
        var c = 0;
        angular.forEach(jobObj.alerts, function(value) {
            if (value.issue.length > 0) {
                c = 1;
            }
        });
        if (c == 0) {
            $scope.issueObj = false;
        }
        if ($scope.openedJobId == jobId) {
            $scope.openedIssueType = '';
            $scope.selectedAlertIssueId = '';
            $scope.openedJobId = '';
            $scope.issueObj = '';
            return false;
        }
        jobId = $scope.subJobId;
        $scope.openedJobId = jobId;
        $scope.getJobDetails(jobId);
    };
    $scope.showDot = [];
    $scope.showDot['client'] = [];
    $scope.showDot['system'] = [];
    $scope.checkConfirmOverRide = function(issueObj, issueType) {
        var issueId = (issueType == 'client') ? issueObj.alertIssueId : issueObj.systemIssueId;
        $scope.showDot[issueType][issueId] = true;
        if (checkConfirmDetail(issueObj.confirmDetail) || (issueObj.overrideNote != null && issueObj.overrideNote != '')) {
            $scope.showDot[issueType][issueId] = false;
        }
    };
    var checkConfirmDetail = function(confirmDetail) {
        if (confirmDetail != '' && confirmDetail != undefined) {
            confirmDetail = (typeof(confirmDetail) === 'object') ? confirmDetail : JSON.parse(confirmDetail);
            if (!confirmDetail || confirmDetail === '') {
                return false;
            }
            if (confirmDetail.scheduleVisit !== '' && confirmDetail.contactCustomer !== '' && confirmDetail.discipliniaryAction !== '' && confirmDetail.contactPoolTech !== '') {
                return true;
            }
        }
        return false;
    };
    $scope.checkConfirmDetail = checkConfirmDetail;
    //to parse job Details data accroding to client and system type
    $scope.parseJobDetails = function(jobDetails) {
        var alertsIssueArray = [];
        var alertsAssetsArray = {};
        alertsIssueArray['client'] = [];
        alertsIssueArray['system'] = [];
        var issueObj = "";
        var alertType = "system";
        angular.forEach(jobDetails.alerts, function(parentElement) {
            if (parentElement.issue.length > 0) {
                angular.forEach(parentElement.issue, function(element, key) {

                    if(!issueObj && key == 0){
                      issueObj = element
                      alertType = 'client';
                    }
                    try {
                        if (element.confirmDetail) {
                            element.confirmDetail = (typeof element.confirmDetail == 'string') ? JSON.parse(element.confirmDetail) : element.confirmDetail;
                        } else {
                            element.confirmDetail = {
                                scheduleVisit: false,
                                contactCustomer: false,
                                discipliniaryAction: false,
                                contactPoolTech: false
                            };
                        }
                    } catch (error) {
                        element.confirmDetail = {
                          scheduleVisit: false,
                          contactCustomer: false,
                          discipliniaryAction: false,
                          contactPoolTech: false
                        };
                    }
                    if (typeof alertsIssueArray[element.alertIssueId] == 'undefined') {
                        alertsIssueArray[element.alertIssueId] = [];
                    }
                    element.customNote2 = element.customNote;
                    alertsIssueArray['client'][element.alertIssueId] = element;
                    alertsAssetsArray[element.alertIssueId] = parentElement.assets;
                });
            }
            if (parentElement.systemIssue.length > 0) {
                angular.forEach(parentElement.systemIssue, function(element, key) {
                    try {
                      if(!issueObj && key == 0){
                        issueObj = element;
                      }
                        if (element.confirmDetail) {
                            element.confirmDetail = (typeof element.confirmDetail == 'string') ? JSON.parse(element.confirmDetail) : element.confirmDetail;
                        } else {
                            element.confirmDetail = {
                              scheduleVisit: false,
                              contactCustomer: false,
                              discipliniaryAction: false,
                              contactPoolTech: false
                            };
                        }
                    } catch (error) {
                        element.confirmDetail = {
                          scheduleVisit: false,
                          contactCustomer: false,
                          discipliniaryAction: false,
                          contactPoolTech: false
                        };
                    }
                    if (typeof alertsIssueArray[element.systemIssueId] == 'undefined') {
                        alertsIssueArray[element.systemIssueId] = [];
                    }
                    element.customNote2 = element.customNote;
                    alertsAssetsArray[element.systemIssueId] = parentElement.assets;
                    alertsIssueArray['system'][element.systemIssueId] = element;


                });
            }
        });

        $scope.alertsIssueTabs(jobDetails, issueObj, alertType);

        jobDetails.alertsIssueArray = alertsIssueArray;
        jobDetails.alertsAssetsArray = alertsAssetsArray;
        $scope.jobDetails = jobDetails;
        $scope.activityHistory = (jobDetails.activityHistory) ? jobDetails.activityHistory : jobDetails.instHistory;
        setTimeout(function() {
            try {
                if ($scope.actionFrom != 'iconClick') {
                    document.querySelector("#issues-tabs-" + jobDetails.jobId + " > div > a:first-of-type").click();
                }
            } catch (error) {}
        }, 100);
    };
    $scope.alertConfirmModel = {
      scheduleVisit: false,
      contactCustomer: false,
      discipliniaryAction: false,
      contactPoolTech: false
    };
    $scope.startDate = '';
    //to get job details by jobid
    $scope.getJobDetails = function(jobId, actionFrom, isInstall=false) {
        if (!jobId) {
            return
        }
        if ($rootScope.userSession) {
            var userId = $rootScope.userSession.id;
            // $scope.isProcessing = true;
            apiGateWay.get("/job_details", {
                jobId: jobId,
                userId: userId,
                type: "technician"
            }).then(function(response) {
                if (response.data.status == 200) {
                    var jobDetails = response.data.data;
                    $rootScope.showCaptionInCustomerEmail = jobDetails.showCaption;
                    $scope.job = jobDetails;
                    if(jobDetails && 'serviceManagerId' in jobDetails && jobDetails.serviceManagerId == 0)
                    {
                        $rootScope.addUpdateManager("add", $scope.jobId);
                    }
                    service.jobDetails[jobId] = jobDetails;
                    $scope.techProfileImage = (jobDetails.techProfileImage == '') ? $scope.techProfileImage : jobDetails.techProfileImage;
                    if (jobDetails.managerProfileImage != '') {
                        $scope.managerProfileImage = jobDetails.managerProfileImage;
                    }

                    $scope.serviceManagerName = jobDetails.serviceManagerName;
                    $scope.serviceManagerFirstName = jobDetails.serviceManagerFirstName;
                    $scope.serviceManagerLastName = jobDetails.serviceManagerLastName;
                    $scope.technicianName = jobDetails.technicianName;
                    $scope.technicianFirstName = jobDetails.technicianFirstName;
                    $scope.technicianLastName = jobDetails.technicianLastName;
                    // $scope.activityModel = {
                    //     "jobId": jobDetails.jobId,
                    //     "gallanogeCalculated": "0",
                    //     "saltSystem": ""
                    // }
                    // $scope.getCustomerJobList();
                    $scope.parseJobDetails(jobDetails, actionFrom);
                     
                    if(isInstall && $scope.installer){
                        $scope.getInstallHistory($scope.installer.installerId, $scope.subJobId);
                    }
                    // $scope.instHistory = jobDetails.instHistory;
                }/* else if (response.data.status == 203) {
                    $state.go("app.customerdetail", {
                        addressId: $scope.addressId
                    });
                } */
                $scope.isProcessing = false;
            });
        }
    };
    //to get job images
    $scope.jobImages = function(subJobId) {
        if (subJobId) {
            // $scope.isProcessing = true;
            apiGateWay.get("/job_images", {
                jobId: subJobId
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        if(response.data.data.length > 0){
                            var imagesData = response.data.data
                            var slidesArray = [];
                            var extraArray = [];
                            var slideKeyArray = [];
                            var i = 1;
                            var j = 1;
                            angular.forEach(imagesData, function(element, index){
                                if(["Before", "After","No Access"].indexOf(element.assetsType) == -1 && j<3){
                                    extraArray.push(element);
                                    j = j+1;
                                }
                              
                              if(["Before", "After"].indexOf(element.assetsType) != -1 && slideKeyArray.indexOf(element.assetsType) == -1){
                                  slidesArray.push(element);
                                  slideKeyArray.push(element.assetsType);
                              }
                              if(["No Access"].indexOf(element.assetsType) != -1 && i<3){
                                
                                slidesArray.push(element)
                                slideKeyArray.push(element.assetsType);
                                i = i+1;
                            }
                           
                            });
                            $scope.slides = [];
                            $scope.slides = slidesArray;
                            if(slidesArray.length==0){
                                $scope.slides = extraArray;
                            }else if(slidesArray.length==1){
                                if(extraArray.length>0){
                                    $scope.slides.push(extraArray[0]);
                                }
                                
                            }
                        }else{
                          $scope.slides = crowlerPlaceHolderImages;
                        }
                    }
                }
                $scope.isProcessing = false;
            });

            apiGateWay.get("/job_images", {
                jobId: subJobId,
                type:'video'
            }).then(function(response) {
                if (response.data) {
                    if (response.data.status == 200) {
                        if(response.data.data.length > 0){
                            $scope.video = response.data.data[0];
                        }else{
                          $scope.video = false;
                        }
                    }
                }
                $scope.isProcessing = false;
            });
        }
    }
        if ($rootScope.socket) {
        $rootScope.socket.on("manager_response", function(data) {
            if (data['success']) {
                if($scope.jobId == data['jobId'])
                {
                    if ($scope.showLoader == false) {
                        $scope.showLoader = true;
                        if (!$scope.$$phase) $scope.$apply();
                    }
                    if (data['jobAction'] == 'remove') {
                        $scope.managerProfileImage = '';
                        $scope.serviceManagerName = "";


                    }
                    if (data['jobAction'] == 'add') {
                        $scope.managerProfileImage = '';
                        if(data['managerData']['managerImage'])
                        {
                            $scope.managerProfileImage = data['managerData']['managerImage'];
                        }
                        $scope.serviceManagerName = data['managerData']['managerName'];
                    }
                    $scope.showLoader = false;
                }

            }

        });
    }
    $scope.overridenModel = [];
    // to save custom notes
    $scope.saveCustomNote = function(event) {
        if (event.target.value && ($scope.customerNote != event.target.value)) {
            apiGateWay.send("/update_alert", {
                issueId: $scope.selectedAlertIssueId,
                custumNote: event.target.value,
                issueType: $scope.openedIssueType,
                type: 'custom'
            }).then(function() {
                $scope.isProcessing = false;
                $scope.customerNote = event.target.value;
                $scope.jobDetails.alertsIssueArray[$scope.openedIssueType][$scope.selectedAlertIssueId].customNote2 = event.target.value;
                $scope.successCustomNote = 'Note has been successfully saved.';
                $scope.dismissAlertSettingError = false;
                setTimeout(function() {
                    $scope.successCustomNote = '';
                    
                }, 2000);
                var analyticsData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.data = {
                    "jobId": $scope.openedJobId,
                    "customeNote": event.target.value,
                    "issueId": $scope.selectedAlertIssueId
                };
                analyticsData.actionTime = new Date();
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Alerts - Custom Note', "Alerts - Submit Custom Note JobId - " + $scope.openedJobId + " - " + currentDateTime, analyticsDataString, 0, true);
            }, function(error) {
                $scope.errorCustomNote = error;
                setTimeout(function() {
                    $scope.errorCustomNote = '';
                }, 2000);
                $scope.isProcessing = false;
                var analyticsData = {};
                analyticsData.requestData = {
                    issueId: $scope.selectedAlertIssueId,
                    custumNote: event.target.value,
                    issueType: $scope.openedIssueType,
                    type: 'custom'
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Custom Note', "Error on Save Custom Note - " + currentDateTime, analyticsDataString, 0, true);
            });
        }
    };
    $scope.auditLogList = [];
    $scope.totalRecord = 0;
    $scope.totalPage = 0;
    $scope.getAuditLog = function(isOpen) {
        isOpen = isOpen || 0;
        if (isOpen == 1) {
            $scope.currentPage = 1;
        }
        $scope.isProcessing = true;
        apiGateWay.get("/audit_logs", {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            jobId: $scope.jobId
        }).then(function(response) {
            if (response.data.status == 200) {
                var listResponse = response.data.data;
                $scope.totalRecord = listResponse.rows;
                $scope.totalPage = $scope.totalRecord % $scope.limit !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt($scope.totalRecord / $scope.limit) - 1;
                $scope.auditLogList = listResponse.data;
            } else {
                $scope.auditLogList = [];
            }
            if (isOpen == 1) {
                ngDialog.open({
                    template: "templates/auditLogList.html",
                    className: "ngdialog-theme-default",
                    scope: $scope,
                    closeByDocument: false,
                    preCloseCallback: function() {}
                });
            }
            $scope.isProcessing = false;
        }, function(error) {
            var analyticsData = {};
            analyticsData.requestData = {
                offset: $scope.currentPage - 1,
                limit: $scope.limit,
                userNameORAddress: $scope.userNameORAddress
            };
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter("date")(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics("Error - Get Audtit Log List", "Error on getAuditLog - " + currentDateTime, analyticsDataString, 0, true);
        });
    }
    $scope.openAuditLog = function() {
        $scope.getAuditLog(1);
    };
    $scope.goToPage = function(page) {
        $scope.currentPage = page;
        $scope.getAuditLog();
    };
    window.mobilecheck = function() {
      var check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    };
    $scope.sentToQuotePage = function(quoteId){
        $state.go("app.customerquotesdetail",{"quoteId":quoteId}, {reload: true});            
    }
    $scope.callCustomer = function(phoneNo){
        var actionName = "";
        actionName += "Page - Job Overview\n";
        actionName += "Action - Customer phone number clicked\n";
        $rootScope.addAuditLog($scope.jobId, actionName);
        if(window.mobilecheck()){
            document.location.href = 'tel:' + phoneNo;
        }
    };
    $scope.successMail = false;
    $scope.errorMail = false;
    $scope.mailPdf = function(email) {
        var actionName = "";
        actionName += "Page - Job Overview\n";
        actionName += "Action - Email summary pdf button clicked\n";
        $rootScope.addAuditLog($scope.jobId, actionName);
        $scope.isProcessing = true;
        apiGateWay.send("/email_pdf", {
            jobId: $scope.jobId,
            arrivalTime:$filter('date')(new Date($scope.jobDetails.jobAssignTime), "hh:m a"),
            email: email
        }).then(function(response) {
            if (response.status == 200) {
                $scope.successMail = response.data.message;
            } else {
                $scope.errorMail = response.data.message;
            }
            setTimeout(function() {
                $scope.successMail = false;
                $scope.errorMail = false;
            }, 2000);
            $scope.isProcessing = false;
        }, function(error) {
            $scope.errorMail = error;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.successMail = false;
                $scope.errorMail = false;
            }, 2000);
        });
    }

    //Show Email job Popup
    $rootScope.showEmailJobPopup = function(jobId){ 
            let _email = '';
            if ($scope.customerinfo.customer.primaryEmail && $scope.customerinfo.customer.primaryEmail.length > 0) {
                _email = $scope.customerinfo.customer.primaryEmail.split(',')[0]
            }
            $scope.sentEmailModel.email = _email;
            $scope.sentEmailModel.jobId = jobId;
            $scope.successMsg = false;
            $scope.sentEmailError = false;
           ngDialog.open({
                template: 'sentJobEmailPopup.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {  
                    
                }
                });
        }

    //    $rootScope.successMail = false;
    //    $rootScope.errorMail = false;
        $scope.emailJob = function(model){ 
            var actionName = "";
            actionName += "Page - Job Overview\n";
            actionName += "Action - Job Overview Email icon clicked\n";
            $rootScope.addAuditLog(model.jobId, actionName);
            $scope.isProcessing = true;       
            apiGateWay.send("/one_job_email", {jobId:model.jobId, email:model.email}).then(function(response) {
                if (response.status == 200) {
                    $scope.isProcessing = false;       
                    $scope.successProductForm = response.data.message;
                      ngDialog.closeAll();
                } else {
                    $scope.isProcessing = false; 
                    $scope.sentEmailError = response.data.message;
                }
                setTimeout(function() {
                    $scope.sentEmailError = '';
                    $scope.successProductForm = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);
            },function(error){       $scope.isProcessing = false;
                $scope.sentEmailError = error;
                setTimeout(function() {
                    $scope.sentEmailError = '';
                    $scope.successProductForm = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 3000);
                //$scope.error = response.data.message;
            });
         
        }

 /*   $rootScope.successMail = false;
         $rootScope.errorMail = false;
    $rootScope.oneJobEmail = function(jobId) {
        var actionName = "";
        actionName += "Page - Job Overview\n";
        actionName += "Action - Job Overview Email icon clicked\n";
        $rootScope.addAuditLog(jobId, actionName);
        $rootScope.isProcessing = true;
        apiGateWay.send("/one_job_email", {
            jobId: jobId
        }).then(function(response) {
            if (response.status == 200) {
                ngDialog.open({
                    template: 'emailConfirm.html',
                    className: 'ngdialog-theme-default success',
                    scope: $scope,
                    closeByEscape: $scope.productEdit,
                    closeByDocument: $scope.productEdit,
                });   
                $rootScope.responseMsg = response.data.message;
            } else {
                ngDialog.open({
                    template: 'emailConfirm.html',
                    className: 'ngdialog-theme-default error',
                    scope: $scope,
                    closeByEscape: $scope.productEdit,
                    closeByDocument: $scope.productEdit,
                });  
                $rootScope.responseMsg = response.data.message;
            }
            setTimeout(function() {
                ngDialog.close();
            }, 3000);
            $rootScope.isProcessing = false;
        }, function(error) {
            ngDialog.open({
                template: 'emailConfirm.html',
                className: 'ngdialog-theme-default error',
                scope: $scope,
                closeByEscape: $scope.productEdit,
                closeByDocument: $scope.productEdit,
            });  
            $rootScope.responseMsg = error;
            $rootScope.isProcessing = false;
            setTimeout(function() {
               ngDialog.close();
            }, 3000);
        });
    }*/

    $scope.dismissAlertSetting = {
        status:1,
        days:30,
        validateNotes:0,
    }
    $scope.getAdminAlertSetting = function(){  
        apiGateWay.send("/company_dismiss_alert_settings", {"true":1}).then(function(response) {
            if (response.data.status == 200) {
              if(response.data.data && response.data.data.length > 0){
                $scope.dismissAlertSetting = response.data.data[0];                
              }         
            }   
        }, function(error){
        })
    }

    

    /*$rootScope.editFilterLocal = function(){ 
        $scope.editFilterTemplateLocal = true;
        $scope.addJobTemplatePopup = ngDialog.open({
            template: 'editFilterLocal.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByEscape: $scope.productEdit,
            closeByDocument: $scope.productEdit,
            preCloseCallback: function() {
                $scope.productEdit = false;
            }
        });   
    }*/
    $scope.defaultTaxSettingData = {};
    $scope.getDefaultTaxData = function() {
        apiGateWay.send("/quotes_tax", {
            "companyId" : $scope.companyId,
            "addressId" : $stateParams.addressId
        }).then(function(response) {
            if (response.data.status == 200) {
              $scope.defaultTaxSettingData = response.data.data.defaultTaxSettingData;     
            }   
        }, function(error){
        })
    }
    $scope.taxableSubtotal = 0;
    $scope.getSubtotalForTax = function (index,bundleItem,name) { 
        var totalAmountForApplyTax = 0;
        $scope.taxableSubtotal = 0;
        if($rootScope.actionPerformed == 'changed_products_services_tax'){
            $scope.changed_products_services_name= null,
            $scope.changed_products_services_action= null,
            $scope.changed_products_bundle_name = null;
            $scope.changed_products_sub_part_type = null;
            $scope.changed_products_sub_part_name = null;
            $scope.changed_products_sub_part_action = null;
            $scope.changed_products_sub_part_qty = null;
            $rootScope.changed_products_services_index = index;
            $scope.changed_products_sub_part_price = null;
        }
        else{
            if(bundleItem){
                $scope.changed_products_bundle_name = name;
                $scope.changed_products_sub_part_type = bundleItem.category;
                $scope.changed_products_sub_part_name = bundleItem.name;
                $scope.changed_products_sub_part_action = "tax";
                $rootScope.changed_products_services_index = null;
                $scope.changed_products_sub_part_price = (bundleItem.qty)*(bundleItem.price);
            }
        }
        if ($scope.discountCalculation > 0) {
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.lineItemTaxableAmount = 0;
                if (element.isChargeTax == 1 && element.category !== 'Bundle') {
                    var fmt = (typeof element.price === "number") ? element.price : parseFloat(element.price.replace(/[^0-9.-]/g, ''));
                    var itemAmount = $rootScope.negativeRoundUp((element.qty) * fmt);
                    var itemsContributionPercent = (((itemAmount/($scope.bundleSubTotal))*100));
                    var discountOnThisItem = $rootScope.negativeRoundUp((($scope.discountCalculation*itemsContributionPercent)/100));
                    var itemAmountAfterDiscount = $rootScope.negativeRoundUp(itemAmount-discountOnThisItem);
                    totalAmountForApplyTax = $rootScope.negativeRoundUp(totalAmountForApplyTax + itemAmountAfterDiscount);
                    element.lineItemTaxableAmount = itemAmountAfterDiscount;
                }
                if (element.bundleItemReference && element.bundleItemReference.length) {
                    var bundleTaxableAmount = 0;
                    angular.forEach(element.bundleItemReference, (element2, index2) => {
                        element2.lineItemTaxableAmount = 0;
                        if (element2.isChargeTax == 1) {
                            var fmt = (typeof element2.price === "number") ? element2.price : parseFloat(element2.price.replace(/[^0-9.-]/g, ''));
                            var itemAmount = $rootScope.negativeRoundUp((element2.qty) * fmt);
                            var itemsContributionPercent = (((itemAmount/($scope.bundleSubTotal))*100));
                            var discountOnThisItem = $rootScope.negativeRoundUp((($scope.discountCalculation*itemsContributionPercent)/100));
                            var itemAmountAfterDiscount = $rootScope.negativeRoundUp(itemAmount-discountOnThisItem);
                            totalAmountForApplyTax = $rootScope.negativeRoundUp(totalAmountForApplyTax + itemAmountAfterDiscount);
                            element2.lineItemTaxableAmount = itemAmountAfterDiscount;
                            bundleTaxableAmount = bundleTaxableAmount + itemAmountAfterDiscount;
                        }
                    });
                    element.lineItemTaxableAmount = bundleTaxableAmount;
                }
            });
        } else {
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.lineItemTaxableAmount = 0;                
                if (element.isChargeTax == 1 && element.category !== 'Bundle') {
                    var fmt = (typeof element.price === "number") ? element.price : parseFloat(element.price.replace(/[^0-9.-]/g, ''));
                    totalAmountForApplyTax = totalAmountForApplyTax + $rootScope.negativeRoundUp((element.qty) * fmt);
                    element.lineItemTaxableAmount = $rootScope.negativeRoundUp((element.qty) * element.price);
                }
                if (element.bundleItemReference && element.bundleItemReference.length) {
                    var bundleTaxableAmount = 0;
                    angular.forEach(element.bundleItemReference, (element2, index2) => {                        
                        element2.lineItemTaxableAmount = 0;
                        if (element2.isChargeTax == 1) {
                            var fmt = (typeof element2.price === "number") ? element2.price : parseFloat(element2.price.replace(/[^0-9.-]/g, ''));
                            var amount = $rootScope.negativeRoundUp((element2.qty) * fmt);
                            totalAmountForApplyTax = totalAmountForApplyTax + amount;
                            element2.lineItemTaxableAmount = amount;
                            bundleTaxableAmount = bundleTaxableAmount + amount;
                        }
                    });
                    element.lineItemTaxableAmount = bundleTaxableAmount;
                }
            });
        }
        if($scope.discountTitle === '100%' || totalAmountForApplyTax < 0) {
            totalAmountForApplyTax = 0;
        }
        $scope.taxableSubtotal = totalAmountForApplyTax;       
        $scope.getTrimmedVals(); 
        return totalAmountForApplyTax;
    }
    $scope.$watch('bundleSubTotal', function() {  
        $scope.getTrimmedVals();
        if ($scope.taxTitle != '' && $scope.isProductAreaFocused) {
            $scope.onPageLoad = 0;
            $scope.chargeTax();        
        }
    });
    $scope.$watch('discountCalculation', function() {            
        $scope.getTrimmedVals();
    });
    $scope.$watch('taxValue', function() {            
        $scope.getTrimmedVals();
    });
    $scope.chargeTax = function(index) { 
        if ($scope.taxTitle == '' || $scope.taxTitle === undefined || $scope.taxTitle === null) {
            var companyId = {
                title: $scope.defaultTaxSettingData.companyTaxesTitle,
                amount: $scope.defaultTaxSettingData.taxPercentValue,
            }
            $scope.selectTax(companyId,index)
        } else {
            var companyId = {
                title: $scope.taxTitle,
                amount: $scope.taxPercentValue,
            }
            $scope.selectTax(companyId,index)
        }
    }
    $scope.roundUpAtHundreds = function(n = 0) {
        return Number(Math.round(n * 100) / 100)
    }
    $scope.trimmedData = {
        subtotal: 0,
        taxableSubtotal: 0,
        discount: 0,
        tax: 0,
        total: 0
    }
    $scope.getTrimmedVals = function() {
        // ooj-on-ooj-page        
        // if isNaN
        $scope.bundleSubTotal = isNaN($scope.bundleSubTotal) ? 0 : $scope.bundleSubTotal;
        $scope.taxableSubtotal = isNaN($scope.taxableSubtotal) ? 0 : $scope.taxableSubtotal;
        $scope.discountCalculation = isNaN($scope.discountCalculation) ? 0 : $scope.discountCalculation;
        $scope.taxValue = isNaN($scope.taxValue) ? 0 : $scope.taxValue;
        // trimmed
        $scope.trimmedData.subtotal = $rootScope.negativeRoundUp($scope.bundleSubTotal);
        $scope.trimmedData.taxableSubtotal = $rootScope.negativeRoundUp($scope.taxableSubtotal);
        $scope.trimmedData.discount = $scope.roundUpAtHundreds($scope.discountCalculation);
        $scope.trimmedData.tax = $scope.roundUpAtHundreds($scope.taxValue);
        $scope.trimmedData.total = $rootScope.negativeRoundUp(($scope.trimmedData.subtotal - $scope.trimmedData.discount) + ($scope.trimmedData.tax));
        // reAssign to scope
        $scope.bundleSubTotal = $scope.trimmedData.subtotal;
        $scope.taxableSubtotal = $scope.trimmedData.taxableSubtotal;
        $scope.discountCalculation = $scope.trimmedData.discount;
        $scope.taxValue = $scope.trimmedData.tax;
        $scope.bundleTotal = $scope.trimmedData.total;
    }
    $rootScope.openOneTimeJobAuditPopup = () => {
        $scope.oneTimeJobAuditPopup();
    }
    $scope.oneTimeJobAuditPopup = function() {
        ngDialog.open({
          template: 'oneTimeJobAuditPopup.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };

    $scope.getOneTimeJobAuditLogs = function() {
        $scope.isProcessing = true;
        let jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            addressId: $scope.addressId,
            jobId: $scope.jobId,
        };
        apiGateWay.get("/get_one_time_job_audit_logs", jobParam).then(function(response) {
            if (response.data.status == 200) {
                $scope.isProcessing = false;                
                let oneTimeJobAuditResponse = response.data.data;
                $scope.oneTimeJobAuditList = oneTimeJobAuditResponse.data;
                $scope.pageObj.totalRecordInv = oneTimeJobAuditResponse.rows;                
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0; 
            } else {
                $scope.isProcessing = false;
            }
        }, function(error){
            $scope.isProcessing = false;
        });
    }
    
    $scope.goToOneTImeJobAuditListPage = function(page) {
        $scope.pageObj.currentPageInv = page;
        $scope.getOneTimeJobAuditLogs();
    };
    
    $scope.getJobCommisionDetails = function(jobId){
        $scope.isProcessingTechnician = true;
        apiGateWay.get("/one_time_job_commission", {"jobId":jobId}).then(function(response) {
            if (response.status == 200) {
                if(response.data.data && response.data.data.items.length > 0){
                    $scope.commisionsDetails = response.data.data;
                } else {
                    $scope.commisionsDetails = [];
                }
                $scope.getTechnicianList();
                try {
                    if (response.data.data.jobTechName !== null && response.data.data.jobTechName !== "") {
                        let nameArray = response.data.data.jobTechName.split(' ');
                        $scope.jobTechnician =
                            {
                                "firstName": nameArray[0],
                                "lastName": response.data.data.jobTechName.substring(nameArray[0].length).trim(),
                                "userImage": response.data.data.jobTechImage,
                            }
                    } else {
                        $scope.jobTechnician = null;
                    } 
                } catch (error) { }
                try {
                    if (response.data.data.saleTechName !== null && response.data.data.saleTechName !== "") {
                        let nameArray = response.data.data.saleTechName.split(' ');
                        $scope.saleTechnician =
                            {
                                "firstName": nameArray[0],
                                "lastName": response.data.data.saleTechName.substring(nameArray[0].length).trim(),
                                "userImage": response.data.data.saleTechImage,
                            }
                    } else {
                        $scope.saleTechnician = null;
                    }
                } catch (error) { }
            }
            if ($scope.commisionsDetails.length == 0) {
                $scope.isProcessingTechnician = false;
                $scope.isFirstTimeLoad = false;
            }
            $scope.isProcessingTechnician = false;
        }, function(error){
            $scope.isProcessingTechnician = false;
            $scope.isFirstTimeLoad = false;
        })
    }
    $scope.isTechSearching = false;
    $scope.searchTechPayload = {
        status: 'Active', 
        offset: 0, 
        limit: 5, 
        searchKey: '',
        rows: 0,
        hasMoreData: false
    };
    $scope.searchTechPayloadJob = {
        status: 'Active', 
        offset: 0, 
        limit: 5, 
        searchKey: '',
        rows: 0,
        hasMoreData: false
    };
    $scope.searchTechPayloadSales = {
        status: 'Active', 
        offset: 0, 
        limit: 5, 
        searchKey: '',
        rows: 0,
        hasMoreData: false
    };
    $scope.requiredTechPayload = () => {
        let payload = angular.copy($scope.searchTechPayload)
        delete payload.rows
        delete payload.hasMoreData
        return payload;
    }
    $scope.requiredTechPayloadJob = () => {
        let payload = angular.copy($scope.searchTechPayloadJob)
        delete payload.rows
        delete payload.hasMoreData
        return payload;
    }
    $scope.requiredTechPayloadSales = () => {
        let payload = angular.copy($scope.searchTechPayloadSales)
        delete payload.rows
        delete payload.hasMoreData
        return payload;
    }
    var filterTextTimeout;
    $scope.searchTechJob = function(searchText){
        if(searchText == $scope.techSearchKeyJob || (searchText == $scope.techSearchKeyJob && !searchText)){
            return false;
        }         
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        $scope.techSearchKeyJob = searchText;
        $scope.searchTechPayloadJob.offset = 0;
        $scope.searchTechPayloadJob.searchKey = $scope.techSearchKeyJob;
        filterTextTimeout = $timeout(function() {
        apiGateWay.get("/technicians", $scope.requiredTechPayloadJob()).then(function(response) {
              if (response.data.status == 200) {
                $scope.searchTechPayloadJob.rows = response.data.data.rows;
                $scope.searchTechPayloadJob.hasMoreData = (($scope.searchTechPayloadJob.offset + 1) * $scope.searchTechPayloadJob.limit) < response.data.data.rows;
                if(response.data.data.data.length > 0) {
                    var searchTechJob = [];
                    angular.forEach(response.data.data.data, function(tech){
                        if(tech.isActive == 1 && ($scope.commisionsDetails.jobTechId !== null && tech.id !== $scope.commisionsDetails.jobTechId)) {
                            searchTechJob.push(tech);
                        }
                    });
                    $scope.jobTechnicianList = searchTechJob;
                } else {
                    $scope.jobTechnicianList = [];
                }
              } else {
              }
            },
            function(error) {
            });
        }, 500); // delay 250 ms
    }
    var filterTextTimeout;
    $scope.searchTechSales = function(searchText){
        if(searchText == $scope.techSearchKeySale || (searchText == $scope.techSearchKeySale && !searchText)){
            return false;
        }         
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        $scope.techSearchKeySale = searchText;
        $scope.searchTechPayloadSales.offset = 0;
        $scope.searchTechPayloadSales.searchKey = $scope.techSearchKeySale;
        filterTextTimeout = $timeout(function() {
        apiGateWay.get("/technicians", $scope.requiredTechPayloadSales()).then(function(response) {
              if (response.data.status == 200) {
                $scope.searchTechPayloadSales.rows = response.data.data.rows;
                $scope.searchTechPayloadSales.hasMoreData = (($scope.searchTechPayloadSales.offset + 1) * $scope.searchTechPayloadSales.limit) < response.data.data.rows;
                if(response.data.data.data.length > 0) {
                    var searchTechSales = [];
                    angular.forEach(response.data.data.data, function(tech){
                        if(tech.isActive == 1 && ($scope.commisionsDetails.saleTechId !== null && tech.id !== $scope.commisionsDetails.saleTechId)) {
                            searchTechSales.push(tech);
                        }
                    });
                    $scope.saleTechnicianList = searchTechSales;
                } else {
                    $scope.saleTechnicianList = [];
                }
              } else {
              }
            },
            function(error) {
            });
        }, 500); // delay 250 ms
    }
    $scope.loadMoreTechniciansJob = () => {
        $scope.isTechSearching = true;
        $scope.searchTechPayloadJob.offset = $scope.searchTechPayloadJob.offset + 1;
        apiGateWay.get("/technicians", $scope.requiredTechPayloadJob()).then(function(response) {
            if (response.data.status == 200) {
              $scope.searchTechPayloadJob.rows = response.data.data.rows;
              $scope.searchTechPayloadJob.hasMoreData = (($scope.searchTechPayloadJob.offset + 1) * $scope.searchTechPayloadJob.limit) < response.data.data.rows;
              if(response.data.data.data.length > 0) {
                  var jobTech = [];
                  angular.forEach(response.data.data.data, function(tech){
                      if(tech.isActive == 1 && ($scope.commisionsDetails.jobTechId !== null && tech.id !== $scope.commisionsDetails.jobTechId)) {
                          jobTech.push(tech);
                      }
                  });
                  angular.forEach(jobTech, (elementProduct, indexofservice) => {
                    if($scope.jobTechnicianList.indexOf(elementProduct) === -1) {
                        $scope.jobTechnicianList.push(elementProduct);
                    }
                });
              }
              $scope.isTechSearching = false;
              setTimeout(() => {
                var objDiv = document.getElementsByClassName("techListScroll")[0];
                    objDiv.scrollTop = objDiv.scrollHeight;
            }, 100)
            }
          },
          function(error) {
              $scope.isTechSearching = false;
          }
        );
    }
    $scope.loadMoreTechniciansSales = () => {
        $scope.isTechSearching = true;
        $scope.searchTechPayloadSales.offset = $scope.searchTechPayloadSales.offset + 1;
        apiGateWay.get("/technicians", $scope.requiredTechPayloadSales()).then(function(response) {
            if (response.data.status == 200) {
              $scope.searchTechPayloadSales.rows = response.data.data.rows;
              $scope.searchTechPayloadSales.hasMoreData = (($scope.searchTechPayloadSales.offset + 1) * $scope.searchTechPayloadSales.limit) < response.data.data.rows;
              if(response.data.data.data.length > 0) {
                  var salesTech = [];
                  angular.forEach(response.data.data.data, function(tech){
                      if(tech.isActive == 1 && ($scope.commisionsDetails.saleTechId !== null && tech.id !== $scope.commisionsDetails.saleTechId)) {
                          salesTech.push(tech);
                      }
                  });
                  angular.forEach(salesTech, (elementProduct, indexofservice) => {
                    if($scope.saleTechnicianList.indexOf(elementProduct) === -1) {
                        $scope.saleTechnicianList.push(elementProduct);
                    }
                });
              }
              $scope.isTechSearching = false;
              setTimeout(() => {
                var objDiv = document.getElementsByClassName("techListScroll")[1];
                    objDiv.scrollTop = objDiv.scrollHeight;
            }, 100)
            }
          },
          function(error) {
              $scope.isTechSearching = false;
          }
        );
    }
    //to get technician list
    $scope.getTechnicianList = function() {
        $scope.searchTechPayload.searchKey = "";
        apiGateWay.get("/technicians", $scope.requiredTechPayload()).then(function(response) {
              if (response.data.status == 200) {
                $scope.searchTechPayload.rows = response.data.data.rows;
                $scope.searchTechPayload.hasMoreData = (($scope.searchTechPayload.offset + 1) * $scope.searchTechPayload.limit) < response.data.data.rows;
                $scope.searchTechPayloadJob.hasMoreData = $scope.searchTechPayload.hasMoreData;
                $scope.searchTechPayloadSales.hasMoreData = $scope.searchTechPayload.hasMoreData;
                if(response.data.data.data.length > 0) {
                    var rowTechJob = [];
                    var rowTechSales = [];
                    angular.forEach(response.data.data.data, function(tech){
                        if(tech.isActive == 1 && ($scope.commisionsDetails.jobTechId !== null && tech.id !== $scope.commisionsDetails.jobTechId)) {
                            rowTechJob.push(tech);
                        }
                        if(tech.isActive == 1 && ($scope.commisionsDetails.saleTechId !== null && tech.id !== $scope.commisionsDetails.saleTechId)) {
                            rowTechSales.push(tech);
                        }
                    });
                    $scope.jobTechnicianList = rowTechJob;
                    $scope.saleTechnicianList = rowTechSales;
                }
                $scope.assignJobTechnician();
                $scope.assignSaleTechnician();
              } else {
                $scope.jobTechnicianList = [];
                $scope.saleTechnicianList = [];
              }
              $scope.isProcessingTechnician = false;
            },
            function(error) {
                $scope.isProcessingTechnician = false;
            }
          );
      };
      
      $scope.assignJobTechnician = function() {
        angular.forEach($scope.jobTechnicianList, function(tech){
           if(tech.id === $scope.commisionsDetails.jobTechId) {
            $scope.jobTechnician = tech;
           }
        });
      }
      
      $scope.assignSaleTechnician = function() {
        angular.forEach($scope.saleTechnicianList, function(tech){
           if(tech.id === $scope.commisionsDetails.saleTechId) {
            $scope.saleTechnician = tech;
           }
        });
      }
      
      $scope.toggleCommition = function(){
        $scope.showCommision = !$scope.showCommision;
        if ($scope.showCommision) {
            $scope.showCommisionText = 'hide details';
        } else {
            $scope.showCommisionText = 'view details';
        }
      }
      
      $scope.updateJobSaleTechnician = function(comType, cid, value, isDropDown){
        var postData = {};
        if (isDropDown) {
            postData = {
                jobId: parseInt($scope.jobId),
                commType: comType,
                techId: parseInt(cid), 
                actionPerformed: 'changed_technician'
            };
            if (comType === "job") {
              angular.forEach($scope.jobTechnicianList, function (tech) {
                if (tech.id === cid) {
                  $scope.jobTechnician = tech;
                }
              });
              $scope.techSearchBoxJob.techSearchText  = "";
              $scope.techSearchKeyJob = "";
              $scope.searchTechPayloadJob.offset = 0;
              $scope.searchTechPayloadJob.searchKey = "";
            }

            if (comType === "sale") {
              $scope.saleTechnician = null;
              angular.forEach($scope.saleTechnicianList, function (tech) {
                if (tech.id === cid) {
                  $scope.saleTechnician = tech;
                }
              });
              $scope.techSearchBoxSales.techSearchText  = "";
              $scope.techSearchKeySale = "";
              $scope.searchTechPayloadSales.offset = 0;
              $scope.searchTechPayloadSales.searchKey = "";
            }
        } else {
            postData = {
                jobId: parseInt($scope.jobId),
                commType: comType,
                itemId: parseInt(cid),
                itemValue: value ? value : 0.00,
            };
        }
        $scope.isProcessingTechnician = true;
        $scope.isFirstTimeLoad = true;
        apiGateWay.send('/update_job_sales_pay', postData).then(function(response) {
            if(response.data.data.commissionData.items && response.data.data.commissionData.items.length > 0){
                $scope.commisionsDetails = response.data.data.commissionData;
            } else {
                $scope.commisionsDetails = response.data.data.commissionData;
            }
            try {
                if (response.data.data.commissionData.jobTechName !== null && response.data.data.commissionData.jobTechName !== "") {
                    let nameArray = response.data.data.commissionData.jobTechName.split(' ');
                    $scope.jobTechnician =
                        {
                            "firstName": nameArray[0],
                            "lastName": response.data.data.commissionData.jobTechName.substring(nameArray[0].length).trim(),
                            "userImage": response.data.data.commissionData.jobTechImage,
                        }
                } else {
                    $scope.jobTechnician = null;
                } 
            } catch (error) { }
            try {
                if (response.data.data.commissionData.saleTechName !== null && response.data.data.commissionData.saleTechName !== "") {
                    let nameArray = response.data.data.commissionData.saleTechName.split(' ');
                    $scope.saleTechnician =
                        {
                            "firstName": nameArray[0],
                            "lastName": response.data.data.commissionData.saleTechName.substring(nameArray[0].length).trim(),
                            "userImage": response.data.data.commissionData.saleTechImage,
                        }
                } else {
                    $scope.saleTechnician = null;
                }
            } catch (error) { }
            $scope.isProcessingTechnician = false;
            $scope.isFirstTimeLoad = false;
            $scope.getTechnicianList();
        }, function(error){
            $scope.isProcessingTechnician = false;
            $scope.isFirstTimeLoad = false;
        })
      }
      $rootScope.refreshProductSearch = (productName) => {
          $scope.showListForBundle(productName)
      }
      $scope.$on("$destroy", function() {
        if ($rootScope.isCommonForm) {
            $rootScope.isCommonForm = false;
            $rootScope.isCategoryLoaded = false;
        }
        $rootScope.showCaptionInCustomerEmail = null;
    });
    $rootScope.isDuplicateJobCreating = false;
    $rootScope.duplicateOneTimeJob = function() {
        if ($rootScope.isDuplicateJobCreating) {
            return
        }
        $scope.successProductForm = '';
        $scope.errorProductForm = '';
        $rootScope.isDuplicateJobCreating = true;
        let jobParam = {
            id: $rootScope.jobId
        }
        apiGateWay.send("/copy_job", jobParam).then(function(response) {
            if (response.data.status == 200 && response.data.data && response.data.data.newJobId) {                
                let newJobId = response.data.data.newJobId;
                let successProductForm = 'Job duplicated';
                if (response.data && response.data.message) {
                    successProductForm = response.data.message
                }
                $scope.successProductForm = successProductForm;
                $timeout(() => { 
                    $scope.successProductForm = '';
                    $state.go("app.onetimejob", {
                        addressId: $scope.addressId,
                        jobId: newJobId
                    }, { reload: true });
                    $rootScope.isDuplicateJobCreating = false;
                 }, 1000);                
            } else {                
                $rootScope.isDuplicateJobCreating = false;
                let errorMsg = 'Something went wrong';
                if (response.data && response.data.message) {
                    errorMsg = response.data.message
                }
                $scope.errorProductForm = errorMsg;
                $timeout(() => { $scope.errorProductForm = '' }, 2000);
            }
        }, function(error){
            $rootScope.isDuplicateJobCreating = false;
            let errorMsg = 'Something went wrong';
            if (typeof error === 'string') {
                errorMsg = error;
            }
            $scope.errorProductForm = errorMsg;
            $timeout(() => { $scope.errorProductForm = '' }, 2000);
        });
    }
    $scope.isDurationPickerShowing = false;
    $scope.checkCalendar = function() {
        var calendarElement = angular.element(document.querySelector('#oneTimeJobDurationPickerParent .bootstrap-datetimepicker-widget'));
        var startTimePickerOptionParent = angular.element(document.querySelector('#startTimePickerOptionParent .bootstrap-datetimepicker-widget'));
        var endTimePickerOptionParent = angular.element(document.querySelector('#endTimePickerOptionParent .bootstrap-datetimepicker-widget'));
        $scope.isDurationPickerShowing = !!(calendarElement.length || startTimePickerOptionParent.length || endTimePickerOptionParent.length );
    };
    $scope.checkCalendar();    
    angular.element(document).on('click', function() {
        $scope.$apply(function() {
            $scope.checkCalendar();
        });
    });    
    // rescheculeJob
    $scope.rescheculeJobConfirmationModal = null;
    $scope.rescheduleSuccess = '';
    $scope.rescheduleError = '';
    $scope.isJobRescheduling = false;
    $scope.rescheculeJobConfirmation = function() {
        $scope.rescheculeJobConfirmationModal = ngDialog.open({
            template: 'rescheculeJobConfirmationModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByDocument: true,
            closeByNavigation: $scope.isJobRescheduling,
            scope: $scope,
            preCloseCallback: function () {
            }
        });
    }
    $scope.closeRescheculeJobConfirmationModal = function() {
        $scope.rescheculeJobConfirmationModal.close();
    }
    $scope.rescheduleJob = function() {
        if ($scope.isJobRescheduling) {
            return
        }
        $scope.rescheduleSuccess = '';
        $scope.rescheduleError = '';
        $scope.isJobRescheduling = true;
        let jobParam = {
            id: $scope.jobId
        }
        apiGateWay.send("/rescheduled_Job", jobParam).then(function(response) {
            if (response.data.status == 200 && response.data.data && response.data.data.newJobId) {                
                let newJobId = response.data.data.newJobId;
                let rescheduleSuccess = 'Job Rescheduled';
                if (response.data && response.data.message) {
                    rescheduleSuccess = response.data.message
                }
                $scope.rescheduleSuccess = rescheduleSuccess;
                $timeout(() => { 
                    $scope.closeRescheculeJobConfirmationModal();
                    $scope.rescheduleSuccess = '';
                    $state.go("app.onetimejob", {
                        addressId: $scope.addressId,
                        jobId: newJobId
                    }, { reload: true });
                    $scope.isJobRescheduling = false;
                 }, 1000);                
            } else {                
                $scope.isJobRescheduling = false;
                let errorMsg = 'Something went wrong';
                if (response.data && response.data.message) {
                    errorMsg = response.data.message
                }
                $scope.rescheduleError = errorMsg;
                $timeout(() => { $scope.rescheduleError = '' }, 2000);
            }
        }, function(error){
            $scope.isJobRescheduling = false;
            let errorMsg = 'Something went wrong';
            if (typeof error === 'string') {
                errorMsg = error;
            }
            $scope.rescheduleError = errorMsg;
            $timeout(() => { $scope.rescheduleError = '' }, 2000);
        });
    }
    // rescheculeJob
    // assign job to route   
    $scope.datePickerOptionRoutePopup = { 
        format: 'YYYY-MM-DD', 
        showClear: false, 
        widgetParent: '#datePickerOptionRoutePopup',   
        minDate: moment().format('YYYY-MM-DD')     
    }; 
    $scope.routeAssignModal = null;
    $scope.routeSearchTodayDate = moment().format('YYYY-MM-DD');
    $scope.checkingAddressAssignment = false;
    $scope.checkAddressAssignment = function() {
        if ($scope.checkingAddressAssignment) {
            return
        }
        let payload = [];
        if ($scope.unscheduled) {
            payload = [{ addressId: $scope.addressId, dayName: "" }]
        } else {
            payload = [{ addressId: $scope.addressId, dayName: "", isOneOfJob: 1, isTemporary: 0 }]            
        }
        $scope.checkingAddressAssignment = true;
        apiGateWay.send('/check_address_assignment', payload).then(function(response) { 
            if (response.data.status == 200) {
                if (response.data.data == '1') {
                    $scope.openRoutePopup();          
                }
            }
            $scope.checkingAddressAssignment = false;          
        }, function(error) {
            $scope.checkingAddressAssignment = false;
        });
    }
    $scope.routeModalDataShown = false;
    $scope.openRoutePopup = function() {
        if ($scope.routeAssignModal) {
            return
        }
        $scope.routeAssignModal = ngDialog.open({
            template: 'routeAssignModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByDocument: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.routeAssignModal = null; 
                $scope.routeModalDataShown = false;               
                // $scope.routeSearchDate = moment($scope.assignRouteDate).format('YYYY-MM-DD');
            }
        });
        $timeout(function(){       
            if ($scope.unscheduled) {
                if ($scope.dueDate && $scope.dueDate != '') {
                    let today = moment().format('YYYY-MM-DD');
                    let dueDate = moment($scope.dueDate).format('YYYY-MM-DD');
                    let _today = new Date(today);
                    let _dueDate = new Date(dueDate);
                    if (_today <= _dueDate) {
                        $scope.routeSearchDate = moment($scope.dueDate).format('YYYY-MM-DD');                        
                    } else {
                        $scope.routeSearchDate = moment().format('YYYY-MM-DD');
                    }
                } else {
                    $scope.routeSearchDate = moment().format('YYYY-MM-DD');
                }
            } else {
                $scope.routeSearchDate = moment($scope.assignRouteDate).format('YYYY-MM-DD');
            }
            var routeDatePickerInput = $(document).find('#datePickerInput');
            if (routeDatePickerInput) {                
                $(routeDatePickerInput[0]).val($scope.routeSearchDate)
                routeDatePickerInput.blur();
            }
            $scope.routeModalDataShown = true;
        }, 150);
    }
    $scope.getFormattedRouteSearchDate = function() {    
        let date = angular.copy($scope.routeSearchDate)
        return moment(date).format('dddd, MMMM D, YYYY')
    }    
    $scope.isTargetDateIsToday = function () {
        return $scope.routeSearchTodayDate == $scope.routeSearchDate
    }
    $scope.changeRouteSearchDate = function(direction) {
        let inputDatePicker = document.querySelector('#datePickerInput')        
        if (direction == 'datePicker') {
            $scope.routeSearchDate = moment(inputDatePicker.value).format('YYYY-MM-DD');
            $scope.isRouteDatePickerShowing = false;
        }
        if (direction === 'prev') {
            $scope.routeSearchDate = moment($scope.routeSearchDate).subtract(1, 'days').format('YYYY-MM-DD');
        }
        if (direction === 'next') {
            $scope.routeSearchDate = moment($scope.routeSearchDate).add(1, 'days').format('YYYY-MM-DD');
        }
        if (inputDatePicker) {
            inputDatePicker.value = $scope.routeSearchDate
        }        
        $scope.getRouteList();
    }
    $scope.fetchRoutesInterval = null;
    $scope.isOneTimeJobRoutesLoading = false;
    $scope.allRoutesForOneTimeJob =[];
    $scope.getRouteList = function() {        
        let endpoint = '/route_list';
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {
                    r.canceller.resolve();
                }
            })
        }     
        clearInterval($scope.fetchRoutesInterval);
        $scope.isOneTimeJobRoutesLoading = true;
        $scope.fetchRoutesInterval = setTimeout(function(){  
            $scope.allRoutesForOneTimeJob =[];          
            let payload = {
                date: $scope.routeSearchDate
            }
            apiGateWay.get(endpoint, payload).then(function(response) { 
                if (response.data.status == 200) {
                    let routes = [];
                    let routeResponse = response.data.data;
                    if (routeResponse && routeResponse.length > 0) {
                        routeResponse.forEach(function(route){
                            routes.push({
                                title: route.title,
                                routeId: route.id,
                                color: route.color,
                                userImage: route.userImage ? route.userImage : null,
                                techFirstname: route.techFirstname,
                                techLastname: route.techLastname,
                                technicianId: route.technicianId,
                                date: payload.date,                                
                            })
                        })
                    }
                    $scope.allRoutesForOneTimeJob = routes;
                    $scope.routesForOneTimeJob = routes;
                }
                $scope.isOneTimeJobRoutesLoading = false;
            }, function(error) {
                $scope.isOneTimeJobRoutesLoading = false;
            })
        }, 200) 
    }
    // $scope.getRouteList();
    $scope.searchQuery = '';    
    $scope.filterRoutes = function() {
        var query = document.getElementById('routeSearchInput').value.toLowerCase();
        $scope.routesForOneTimeJob = $scope.allRoutesForOneTimeJob.filter(function(route) {
            var title = (route.title || '').toLowerCase();
            var techName = ((route.techFirstname || '') + ' ' + (route.techLastname || '')).toLowerCase();
            return title.includes(query) || techName.includes(query);
        });
    };
    $scope.isJobAssigning = false;
    $scope.assignRouteSuccess = '';
    $scope.assignRouteError = '';
    $scope.assignRoute = function(route) {
        let payload = {
            routeId: route.routeId,
            toTechnician: route.technicianId ? route.technicianId : 0,
            addressId: [{ "addressId": $scope.addressId, "jobId": $scope.jobId }],
            date: route.date,
            assignType: "fromJobDetailPage",
            isTempMove: false
        }
        if ($scope.unscheduled) {
            payload.fromRoute = 0;
            payload.fromTechnician = 0;
            payload.fromDate = $scope.routeSearchTodayDate;     
        }
        if ($scope.scheduled) {            
            payload.fromRoute = $scope.scheduled.routeId ? $scope.scheduled.routeId : 0;
            payload.fromTechnician = $scope.scheduled.technicianId && $scope.scheduled.technicianId ? $scope.scheduled.technicianId : 0;
            payload.fromDate = $scope.scheduled.assignRouteDate;
        }
        $scope.isJobAssigning = true;
        apiGateWay.send("/assign_address_route", payload).then(function(response) {
            if (response.data.status == 200 && response.data.data) {                
                $scope.changeStatus($scope.addressId);
                $scope.successProductForm = 'Job assigned to the Route';
                $timeout(() => { $scope.successProductForm = '' }, 2000);
                $scope.routeAssignModal.close();              
                $scope.isJobAssigning = false;
                $scope.updateScheduleData(payload);
                $scope.updateJobSaleTechnician('job', payload.toTechnician, '', true);
            } else {                
                $scope.isJobAssigning = false;
                let errorMsg = 'Something went wrong';
                if (response.data && response.data.message) {
                    errorMsg = response.data.message
                }
                $scope.errorProductForm = errorMsg;
                $timeout(() => { $scope.errorProductForm = '' }, 2000);
                $scope.routeAssignModal.close();
            }
        }, function(error){
            $scope.isJobAssigning = false;
            let errorMsg = 'Something went wrong';
            if (typeof error === 'string') {
                errorMsg = error;
            }
            $scope.errorProductForm = errorMsg;
            $timeout(() => { $scope.errorProductForm = '' }, 2000);
            $scope.routeAssignModal.close();
        });        
    }
    $scope.updateScheduleData = function(data) {
        apiGateWay.get("/one_off_job", {
            jobId: $scope.jobId,
        }).then(function(response) {
            if (response.data.status == 200) {
                $scope.parseScheduleData(response.data.data.scheduleStatus)
            } else {
                let errorMsg = 'Something went wrong';
                if (response.data && response.data.message) {
                    errorMsg = response.data.message
                }
                $scope.errorProductForm = errorMsg;
                $timeout(() => { $scope.errorProductForm = '' }, 2000);
            }
        }, function(error) {
            let errorMsg = 'Something went wrong';
            if (typeof error === 'string') {
                errorMsg = error;
            }
            $scope.errorProductForm = errorMsg;
            $timeout(() => { $scope.errorProductForm = '' }, 2000);
        })
    }
    $scope.parseScheduleData = function(scheduleStatus) {
        $scope.scheduled = scheduleStatus;           
        if(!$scope.scheduled){
            $rootScope.unscheduled = "True";
        } else {
            // $scope.scheduled.routeId = 28978
            $rootScope.unscheduled = "";
            let firstName = '';
            let lastName = '';                
            firstName = $scope.scheduled.techDetail.techFirstname ? $scope.scheduled.techDetail.techFirstname : '';
            lastName = $scope.scheduled.techDetail.techLastname ? $scope.scheduled.techDetail.techLastname : '';
            $scope.shortName = firstName.charAt(0)+lastName.charAt(0);        
        }
        if($scope.scheduled){
            let assignRouteDate = $scope.scheduled.assignRouteDate;
            let assignRouteDateString = moment(assignRouteDate).format('MM/DD/YYYY');
            $scope.assignRouteDate  = assignRouteDateString;
            if($scope.scheduled.technicianId){
                $scope.technicianId = $scope.scheduled.technicianId; 
            }
        } else {
           $scope.assignRouteDate = '';
        }
    }
    // assign job to route
    // customer & job notes
    $scope.activeOPLTab = '';
    $scope.openOPLTab = function(tab) {
        if ($scope.activeOPLTab != tab) {
            $scope.activeOPLTab = tab
        }
    }
    $scope.openOPLTab('jobNotes')
    // customer & job notes
});
