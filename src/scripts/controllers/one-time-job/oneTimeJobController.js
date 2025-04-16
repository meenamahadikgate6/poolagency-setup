angular.module('POOLAGENCY').controller('oneTimeJobController', function($rootScope, $scope,$window, Carousel, deviceDetector, $timeout, $filter, $sce, apiGateWay, service, $state, $stateParams, ngDialog, Analytics, configConstant, auth) {
    $scope.jobId = $stateParams.jobId;
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
    $scope.bundleList = [];
    $scope.bundleListNew = [];
    $scope.bundleSearchText = '';
    $scope.productEdit = false;
    $scope.bundleSearchListNew = '';
    $scope.productBundleListNew = [];
    $scope.productNoItem = false;
    $scope.scheduled = {};
    $scope.unscheduled = "";
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
    $scope.discountValue = 0;
    $scope.discountCalculation = 0;
    $scope.jobStatusId = "";
    $scope.payOptionData = "";
    $scope.payOption = "";
    $scope.payId = "";
    $scope.payOptionValue = "On property at time of job";
    $scope.dueDate = "";
    $scope.companyId = "";
    $scope.taxTitle = "";
    $scope.taxValue = ""; 
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
    $scope.addJobTemplateTrue = false;
    $scope.isSystem = '';
    $scope.customTemplate = [];
    $scope.discountType = '%';
    $scope.filterClean = true;
    $scope.saltClean = false;
    $scope.saveBtnClick = false;

    $scope.addJobTemplate = function(){
        
        apiGateWay.send("/one_job_template", {'isSystem': 0,'status':0}).then(function(response) {
            $scope.isProcessing = true;
            if (response.data.status == 201) {
                let templateId = response.data.data.JobTemplateId;
                $rootScope.templateId = response.data.data.JobTemplateId;
                 $scope.addJobTemplate();
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

    $scope.addJobTemplate = function(){
			$scope.successProductForm = ""; 
            $scope.errorProductForm = "";
            $scope.discountTitle= "";
            $scope.addJobTemplateTrue = true;
            $scope.editTemplate = false;
            $scope.editFilterTemplate = false; 
            $scope.productNoItem = false;  
            $scope.templateId = "";
            $rootScope.templateId = "";  
            $scope.oneJobModel = {}; 
            if(!$scope.oneJobModel.job && !$scope.oneJobModel.job !='None'){
                $scope.oneJobModel.job = {
                    'duration': "2014-02-27T00:00:00"
                }
            }
            $scope.oneJobModel.job.templateName = "";  
            $scope.productBundleListNew = [];   
            $scope.discountValue = "";
            $scope.discountCalculation = "";
            $scope.bundleTotal = 0;
            $scope.bundleSubTotal = 0;
            $scope.costBundleTotal = 0;
            $scope.taxTitle = "";
            $scope.taxPercentValue = "";
            $rootScope.disableBackwashChecklist = false;
            $rootScope.disableBackwashChecklistText = '';
            $rootScope.disableFilterCleanedChecklist = false;
            $rootScope.disableFilterCleanedChecklistText = '';
            $rootScope.disableSaltCellCleanedChecklist = false; 
            $rootScope.disableFilterCleanedChecklistText = '';
            $scope.addJobTemplatePopup = ngDialog.open({
                template: 'addJobTemplate.html',
                className: 'ngdialog-theme-default v-center',
                scope: $scope,
                closeByEscape: false,
                closeByDocument: false,
                preCloseCallback: function() {
                    $scope.productEdit = false;
                    $scope.productBundleListNew = [];
                    $scope.productBundleListNewCategory = [];
                }
            });   
            
            apiGateWay.send("/one_job_template", {'isSystem': 0,'status':0}).then(function(response) {
                if (response.data.status == 201) {
                    $rootScope.templateId = response.data.data.JobTemplateId;
                    $scope.templateId= response.data.data.JobTemplateId;
                    if($rootScope.templateId){
                        $rootScope.isBlurOn = false;
                    }
                    if($scope.oneJobModel.job && response.data.data.templateName){
                        $scope.oneJobModel.job.templateName = response.data.data.templateName;
                    }
                    $rootScope.oneJobTemplate = true;   
                } else {
                    
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

    $scope.editFilterSalt = function(systemTempateId){
        $rootScope.eqTempelateId='';
        if(systemTempateId.templateName == "Salt Cell Clean"){
            $scope.filterClean = false;
            $scope.saltClean = true;
        } else {
            $scope.filterClean = true;
            $scope.saltClean = false;
        }
		$scope.successProductForm = ""; 
        $scope.errorProductForm = ""; 
        $scope.addJobTemplateTrue = false;
        $scope.editTemplate = false;
        $scope.editFilterTemplate = true;
        $scope.templateId = systemTempateId.id;
        $rootScope.templateId = systemTempateId.id;
        $rootScope.oneJobTemplate = true;
        $scope.productBundleListNew = [];
        apiGateWay.get("/one_job_item", {
            jobId: $scope.templateId,
            isTemplate:1
        }).then(function(response) {            
            if (response.data.status == 200) {  
                bundleSubTotal = response.data.data.subTotalAmount;
                if(bundleSubTotal == "null"){
                    $scope.bundleSubTotal = bundleSubTotal;
                } else {
                    $scope.bundleSubTotal = 0;
                }
                let productBundleListNew = response.data.data.productAndService;
                if(productBundleListNew){
                    $scope.productBundleListNew = productBundleListNew; 
                    $scope.productBundleListNewCategory = response.data.data.productAndService.category;
                } else {
                    $scope.productNoItem = true;
                }  
                
                $scope.payOptionData = response.data.data.payOption;
                  angular.forEach($scope.payOptionData, (element, index) => {
                    $scope.payOption = element.option;
                    $scope.payId = element.id;
                  });
                
                
                $scope.discountCalculation = response.data.data.discountValue ? response.data.data.discountValue : 0;
                $scope.bundleTotal = response.data.data.totalAmount ? response.data.data.totalAmount : 0;
                $scope.bundleSubTotal = response.data.data.subTotalAmount ? response.data.data.subTotalAmount : 0;

                $scope.taxData = response.data.data.taxData;
                angular.forEach($scope.taxData, (element, index) => {
                    $scope.companyId = element.companyId;
                });
                
                if(response.data.data.taxValue){
                    $scope.taxValue = response.data.data.taxValue;
                } else{
                    $scope.taxValue = "";
                }

                if(response.data.data.taxPercentValue){
                    $scope.taxPercentValue = response.data.data.taxPercentValue;
                } else{
                    $scope.taxPercentValue = "";
                }
                $scope.getSubtotalForTax();
                if(response.data.data.discountTitle){
                    var str = response.data.data.discountTitle;
                    if(str.includes("$") == true){
                        let matches = str.replace("$", "");
                        $scope.discountType = '$';
                        $scope.discountTitle = '';
                        $scope.discountValue = matches;
                    } 
                    if(str.includes("%") == true){
                        var matches = str.replace("%", "");
                        $scope.discountValue = matches;
                        $scope.discountTitle = response.data.data.discountTitle;
                    }
                } else {
                    $scope.discountValue = "";
                    $scope.discountTitle = "";
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
                $scope.getSubtotalForTax();
            } else {
                $scope.productNoItem = true;               
            }            
        });

        $scope.editFilterTemplateId = systemTempateId.id;
        if(systemTempateId.duration == "Invalid date" || (systemTempateId.duration && !systemTempateId.duration.includes(':'))){
            var duration = "2014-02-27T00:00";
        } else {
            if(systemTempateId.duration){
                var duration =  "2014-02-27T"+systemTempateId.duration;
            } else {
                var duration = "2014-02-27T00:00";
            }
        }
        $scope.oneJobModel={
            "job":{                            
                "duration": duration,
                "instruction": systemTempateId.instruction,
                "jobTitle": systemTempateId.title,
                "note": systemTempateId.officeNote,
                "templateName": systemTempateId.templateName,
                "frequency" : systemTempateId.frequency
            },
        };
        
        if(!systemTempateId.dates){
            systemTempateId.dates = [];
            $scope.oneJobModel.job.dates = [];
        }else{
            $scope.oneJobModel.job.dates = systemTempateId.dates;
        }
        
        if(!systemTempateId.endDate){
            $scope.oneJobModel.job.ends_on = 'never';
        }else{
            systemTempateId.ends_on = 'specific';
            $scope.oneJobModel.job.end_date = systemTempateId.endDate;
        }
        
        if(systemTempateId.dates.length == 0 && systemTempateId.frequency > 0){
            $scope.oneJobModel.job.how_often = 'every';
        }else{
            $scope.oneJobModel.job.how_often = 'specific';
        }
        
        $scope.editTemplate = false;
        $scope.editFilterTemplate = true;       
        $rootScope.disableBackwashChecklist = false;
        $rootScope.disableBackwashChecklistText = '';
        $rootScope.disableFilterCleanedChecklist = false;
        $rootScope.disableFilterCleanedChecklistText = '';
        $rootScope.disableSaltCellCleanedChecklist = false; 
        $rootScope.disableFilterCleanedChecklistText = '';    
        $scope.addJobTemplatePopup = ngDialog.open({
            template: 'addJobTemplate.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByEscape: false,
            closeByDocument: false,
            preCloseCallback: function() {
                $scope.productEdit = false;
                $scope.productBundleListNew = [];
                $scope.productBundleListNewCategory = [];
            }
        });  
    }
    $scope.$on('ngDialog.opened', function (e, $dialog) {
        $scope.errorProductForm = '';
        $scope.successProductForm = ""
        setTimeout(function(){
            $('.duration').mask('00:00');
            $('.input-daterange').datepicker({ 
                format: 'yyyy-mm-dd'
            });
            $("#add_extra_date").datepicker({
                showOn: 'button',
                buttonText: 'Choose Date',
                dateFormat: 'MM/dd',
                startDate: new Date()
            }).on('changeDate', function (ev) {
                var dateIns = new Date(ev.date);
                var day = dateIns.getDate();
                var month = dateIns.getMonth() + 1; 
                var year = dateIns.getFullYear(); 
                var obj = {'date' : day + '-' + month + '-' + year};
                var checkExistence = $scope.oneJobModel.job.dates.filter(function(item){return item.date == (day + '-' + month + '-' + year)});                
                if(checkExistence.length == 0){
                    $scope.oneJobModel.job.dates.push(obj)    
                }
                
            });
        },1000);
    });

    $scope.removeStartDates = function(idx){
        $scope.oneJobModel.job.dates.splice(idx,1);
    }

    $scope.removeProductToBundle = function(productBundleListNew, index){ 
        if ($scope.productBundleListNew.length > -1){
            let total = (typeof $scope.bundleSubTotal === "number") ? $scope.bundleSubTotal : parseFloat($scope.bundleSubTotal.replace(/[^0-9.-]/g, ''));
            let itemTotal = (typeof $scope.productBundleListNew[index].price === "number") ? $scope.productBundleListNew[index].price : parseFloat($scope.productBundleListNew[index].price.replace(/[^0-9.-]/g, ''));
            itemTotal = itemTotal < 0 ? Math.abs(itemTotal) : itemTotal;
            if ((total - itemTotal) < 0) {
              $scope.errorProductForm = "The job template total can't be less than $0.00";
              setTimeout(function () {
                $scope.errorProductForm = "";
              }, 2000);
              return false;
            }
            $scope.productBundleListNew.splice( index, 1);
            $scope.calculateBundleDurationTemp($scope.productBundleListNew); 
        }    
        if($scope.productBundleListNew.length == 0){
            $scope.bundleSubTotal = 0;
            $scope.bundleTotal = 0;
            $scope.discountCalculation = 0;
            $scope.taxValue = 0;
            $scope.discountValue = 0;
            $scope.discountTitle = "";
            $scope.taxPercentValue = "";
            $scope.taxTitle = "";
        }
        $scope.calculateBundleCostTemp();
        $scope.updateDiscounts();
        $scope.updateTaxes();
    }

    $scope.saveOneTimeJob = function() {  
                let createdJobId = $scope.jobId;
                let saveOneTimeJobData = {
                    "addressId":$scope.addressId,
                    "dueDate" : $scope.dueDate,
                    "jobId": createdJobId,
                    "title":$scope.oneJobModel.job.jobTitle, 
                    "waterBodyId":$scope.waterBodyListId,
                    "instruction":$scope.oneJobModel.job.instruction,
                    "note":$scope.oneJobModel.job.note,
                    "duration":$scope.oneJobModel.job.duration,
                    "templateId":$scope.templateId,
                    "timeId":$scope.jobTimeId,
                    "jobStatus":$scope.statusId,
                };
                apiGateWay.send("/one_off_job", saveOneTimeJobData).then(function(response) {
                    if (response.data.status == 201) {
                        $scope.changeStatus($scope.addressId);
                        $scope.successProductForm = response.data.message; 
                        setTimeout(function() {
                            $scope.successProductForm = "";
                        }, 2000);         
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


    $scope.saveOneTimeJobTemplate = function() {
        if ($scope.productBundleListNew.length > 0 && !$rootScope.negativeCheckPassed($scope.productBundleListNew)) {
            $scope.errorProductForm = "The job template total can't be less than $0.00";
            setTimeout(function () {
              $scope.errorProductForm = "";
            }, 2000);
            return false;
        }
          
        $('.has-error').removeClass('has-error');
       
        var isError = false;   
        $scope.saveBtnClick = false;     
        if(!$scope.editFilterTemplate){
            if(!$scope.oneJobModel.job.templateName){
                $scope.errorProductForm = 'Please enter template name';
                $scope.saveBtnClick = false; 
                setTimeout(function() { 
                    $scope.errorProductForm = ""; 
                }, 2000);  
                $("#templateNameBox").addClass("has-error");            
                isError = true;
            }
        }     
        
        
        /*if(!$scope.oneJobModel.job.jobTitle){
            $("#tempTitle").parent().addClass("has-error");            
            isError = true;
        }*/

        if($scope.oneJobModel.job.how_often == 'every' && ($scope.oneJobModel.job.frequency == 0 || !$scope.oneJobModel.job.frequency)){
            //$scope.errorProductForm = 'Please enter valid frequency';
            $("#frequency_val").addClass("has-error");            
            isError = true;            
        }
        
        if ($scope.oneJobModel.job.how_often == 'specific' && $scope.oneJobModel.job.dates.length == 0){
            $scope.errorProductForm = 'Please select the date';
            setTimeout(function() {                           
                $scope.errorProductForm = "";
            }, 2000);  
            if (!$scope.$$phase) $scope.$apply();
            isError = true;
        }
        
        if(isError){
            return;
        }        
        
            if($scope.editFilterTemplate){
                $scope.isSystem = 1;
            } else {
                $scope.isSystem = 0;
            }

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
            if ($scope.oneJobModel.job.how_often == 'every') {
                $scope.oneJobModel.job.dates = [];
            } else {
                $scope.oneJobModel.job.frequency = 0;
            }
            //var jobDuration = moment($scope.oneJobModel.job.duration).format('HH:mm').toString();
           
            let saveJobTemplateData = {
                "id":$scope.templateId,
                "title":$scope.oneJobModel.job.jobTitle,
                "isSystem": $scope.isSystem,
                "instruction": $scope.oneJobModel.job.instruction,
                "duration": jobDuration,
                "officeNote": $scope.oneJobModel.job.note,
                "frequency": $scope.oneJobModel.job.frequency,
                "dates": $scope.oneJobModel.job.dates,
                "status": 1,
                "templateName": $scope.oneJobModel.job.templateName
            };
            
            if (saveJobTemplateData['dates'] && saveJobTemplateData['dates'].length > 0) {
                var datesArr = saveJobTemplateData['dates'];
                var updatedDateArr = [];
                datesArr.forEach(function(xdate){
                    var notFormattedDate = xdate.date;
                    var notFormattedDateArr = notFormattedDate.split('-');
                    var zdate = notFormattedDateArr[0];
                    zdate = Number(zdate);
                    if (zdate < 10) {
                        zdate = '0' + zdate;
                    }
                    var zmonth = notFormattedDateArr[1];
                    zmonth = Number(zmonth);
                    if (zmonth < 10) {
                        zmonth = '0' + zmonth;
                    }
                    var zyear = notFormattedDateArr[2];
                    updatedDateArr.push({ date: zdate+'-'+zmonth+'-'+zyear  })
                });
                saveJobTemplateData['dates'] = updatedDateArr;
            }
        
            
            if($scope.bundleTotal >= 0){
                $scope.errorDiscount = false;
                $rootScope.oneJobTemplate = true;
                // $scope.editTemplate = false;
                $rootScope.isBlurOn = true;
                $scope.saveBtnClick = true;
                $rootScope.saveCheckListItem();
                $scope.isBundleSearch = false;
                setTimeout(function () {
                    apiGateWay.send("/one_job_template", saveJobTemplateData).then(function(response) {
                            if (response.data.status == 201) {
                                apiGateWay.get("/one_job_setting").then(function(response) {
                                    if (response.data.status == 200) {  
                                        $scope.customTemplate = response.data.data.customTemplate; 
                                        angular.forEach($scope.customTemplate, (element, index) => {
                                            $scope.customTemplateId = element.id;
                                        });        
                                        $scope.systemTempate = response.data.data.systemTempate; 
                                        angular.forEach($scope.customTemplate, (element, index) => {
                                            $scope.systemTempateId = element.id;
                                        });
                                    } 
                                });
                                $scope.jobTemplateId = response.data.data.JobTemplateId;
                                $rootScope.templateId = $scope.jobTemplateId;
                                $scope.saveOneTimeJobItemTemplate();
                                if($rootScope.errorChecklist){
                                    $scope.errorProductForm = $rootScope.errorChecklist;
                                    $scope.saveBtnClick = false;
                                    setTimeout(function(){
                                            $scope.errorProductForm = "";
                                        }, 2000);
                                    }  
                                    else{
                                        $scope.successProductForm = response.data.message;
                                        setTimeout(function(){
                                            $scope.successProductForm = "";
                                            ngDialog.close();
                                            $scope.saveBtnClick = false; 
                                        }, 2000);
                                    }
                            } else {
                                $scope.saveBtnClick = false;
                                $scope.errorProductForm = 'Error';
                            }
                            $scope.isProcessing = false;
                        },function(error) {    
                            $scope.saveBtnClick = false;    
                            $scope.isProcessing = false;
                            $scope.errorProductForm = error;
                            setTimeout(function() {
                                $scope.errorProductForm = "";
                            }, 2000);
                        });
                },2000)
            } else{
                $scope.errorDiscount = true;
                setTimeout(function() {
                    $scope.errorDiscount = false;
                }, 2000); 
            } 
        
    }

    $scope.cancelJobTemp = function() {
        $scope.productBundleList = null;
    }

    $scope.saveOneTimeJobItem = function() {
        if($scope.discountCalculation){
            var discountTitle = $scope.discountValue + $scope.discountType;
        } else {
            var discountTitle = "";
        }

            let createdJobId = $scope.jobId;
            $scope.getTrimmedVals();
            let saveOneTimeJobItem = {
                "itemReference":$scope.productBundleListNew,
                "jobId":createdJobId,
                "payOption":$scope.payId,
                "subTotalAmount":$scope.bundleSubTotal,
                "discountTitle":discountTitle,
                "discountValue":$scope.discountCalculation,
                "taxTitle":$scope.taxTitle ? $scope.taxTitle : '',
                "taxValue":$scope.taxValue,
                "taxPercentValue":$scope.taxPercentValue ? $scope.taxPercentValue : 0,
                "totalAmount":$scope.bundleTotal,
                "taxableSubtotalAmount":$scope.taxableSubtotal
            };
            apiGateWay.send("/one_job_item", saveOneTimeJobItem).then(function(response) {
                if (response.data.status == 201 || response.data.status == 200) {
                    $scope.successProductForm = response.data.message;  
                    setTimeout(function() {
                        $scope.successProductForm = "";
                    }, 2000);           
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

    $scope.saveOneTimeJobItemTemplate = function() {
        if($scope.discountCalculation){
            var discountTitle = $scope.discountValue + $scope.discountType;
        } else {
            var discountTitle = "";
        }
        if($scope.editFilterTemplate){
            let createdJobId = $scope.templateId;
            $scope.getTrimmedVals();
            let saveOneTimeJobItem = {
                "itemReference":$scope.productBundleListNew,
                "jobId":createdJobId,
                "payOption":$scope.payId,
                "subTotalAmount":$scope.bundleSubTotal,
                "discountTitle": discountTitle,
                "discountValue":$scope.discountCalculation,
                "taxTitle":$scope.taxTitle ? $scope.taxTitle : '',
                "taxValue":$scope.taxValue,
                "taxPercentValue":$scope.taxPercentValue ? $scope.taxPercentValue : 0,
                "totalAmount":$scope.bundleTotal,
                "isTemplate": 1
            };
            apiGateWay.send("/one_job_item", saveOneTimeJobItem).then(function(response) {
                if (response.data.status == 201 || response.data.status == 200) {
                    /*$scope.successProductForm = response.data.message;  
                    setTimeout(function() {
                        $scope.successProductForm = "";
                    }, 2000);*/           
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
        } else {
            let createdJobId = $scope.jobTemplateId;
            $scope.getTrimmedVals();
            let saveOneTimeJobItem = {
                "itemReference":$scope.productBundleListNew,
                "jobId":createdJobId,
                "payOption":$scope.payId,
                "subTotalAmount":$scope.bundleSubTotal,
                "discountTitle":discountTitle,
                "discountValue":$scope.discountCalculation,
                "taxTitle": '',
                "taxValue": 0,
                "taxPercentValue": 0,
                "totalAmount":$scope.bundleTotal,
                "isTemplate": 1
            };
            apiGateWay.send("/one_job_item", saveOneTimeJobItem).then(function(response) {
                if (response.data.status == 201 || response.data.status == 200) {
                   /* $scope.successProductForm = response.data.message;  
                    etTimeout(function() {
                        $scope.successProductForm = "";
                    }, 2000);*/
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
        

    }


    $scope.addBundleProductSearch = () => {
        $scope.saveOneTimeJobVar = true;
        $scope.bundleSearchForm = true;
        setTimeout(function(){
            angular.element("#bundleSearchText").focus();
        }, 100);
    }

    // $scope.showListForBundle = (searchText) => {
    //     $scope.searchText = searchText;
    //     if(searchText.length>0){
    //         $scope.isBundleSearch = true;
    //         apiGateWay.get("/product_services", {
    //             offset: 0,
    //             limit: 20,
    //             sortOrder: 'asc',
    //             sortColumn: 'name',
    //             category: 'Product-Service-Bundle',
    //             status: 1,
    //             name: searchText,
    //         }).then(function(response) {
    //             if (response.data.status == 200) {
    //                 let bundleSearchList = response.data.data.data;
    //                 if($scope.productNoItem == true){
    //                     $scope.productBundleList = bundleSearchList;
    //                 } else {
    //                     $scope.productBundleList = bundleSearchList.filter(ar => !$scope.productBundleListNew.find(rm => (rm.id === ar.id && ar.name === rm.name) ));
    //                 }
                    
    //                 angular.forEach(bundleSearchList, (element, index) => {
    //                     $scope.productBundleListCategory = element.category;
    //                 });
                    
                    

    //             } else {
    //                 $scope.isBundleSearch = false;
    //                 $scope.productBundleList = [];
    //             }
    //             $scope.isProcessing = false;
    //         });
    //     }else{
    //         $scope.isBundleSearch = false;
    //     }
        
    // }

    $scope.templateNameEnter = (keyEvent) => {   
        if (keyEvent.keyCode == 13) {
            angular.element("#templateName").blur();
        }
    }

    $scope.hideSearchBar = function(){  
        if(!$scope.searchText){
            $scope.bundleSearchForm = false;
            $scope.isBundleSearch = false;
        } 
        $scope.searchText = "";
    }
    
    $scope.hideSearchBarIcon = function(){
        $scope.bundleSearchForm = false;
        $scope.isBundleSearch = false;
        $scope.searchText = ""
    }

    $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'jobTemplate') {        
            if (data.isClose) {
                $scope.bundleSearchForm = false;
                $scope.isBundleSearch = false; 
                $scope.searchText = "";             
                return
            }
            let totalCheck = 0;
            if (data.bundleItemReference && data.bundleItemReference.length > 0) {
                let total = 0;
                angular.forEach(data.bundleItemReference, function(item){
                    item.price = (typeof item.price === "number") ? item.price : parseFloat(item.price.replace(/[^0-9.-]/g, ''))
                    total += (item.qty) * (item.price);
                });
                totalCheck = $scope.bundleTotal + total;
            } else {
                totalCheck = $scope.bundleTotal + data.price;
            }
            if (totalCheck < 0) {          
                $scope.errorProductForm = "The job template total can't be less than $0.00";
                setTimeout(function() {
                    $scope.errorProductForm  = "";
                }, 2000);
            } else {
                $scope.addProductToBundleTemplate(data);
            }
        }
    }); 
    $scope.addProductToBundle = (productBundleListCategory) => {
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
                "isChargeTax": productBundleListCategory.isChargeTax,
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "duration": productBundleListCategory.duration ? productBundleListCategory.duration : '00:00'
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
                "isChargeTax": productBundleListCategory.isChargeTax,
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "duration": productBundleListCategory.duration ? productBundleListCategory.duration : '00:00'
            };
            $scope.productBundleListNew.push(bundleObj);
            $scope.productBundleList = angular.copy($scope.productBundleListNew);
        }
        $scope.isBundleSearch = false;
        $scope.bundleSearchForm = false;
        $scope.bundleCost = productBundleListCategory.cost;
        $scope.calculateBundleCostTemp();
       
    }

    $scope.addProductToBundleTemplate = (productBundleListCategory) => {
        if(productBundleListCategory.bundleItemReference && productBundleListCategory.bundleItemReference.length > 0) {
            angular.forEach(productBundleListCategory.bundleItemReference, (element, index) => {
                if(!element.duration){
                    element.duration = '00:00:00'
                }
                //  if isChargeTax is missing from element
                if ((element.isChargeTax === undefined || element.isChargeTax ===  null)) {                
                    apiGateWay.get("/product_services_save", {
                        id: element.id
                    }).then(function(response) {
                        var isChargeTax;
                        //  if isChargeTax is missing from response
                        if(response.data.data.isChargeTax === undefined || response.data.data.isChargeTax === null) {
                            if (element.category == "Product") {
                                if ($scope.taxSettingsForSettingPage.taxOnProduct == 1) {
                                    isChargeTax = 1
                                } else {
                                    isChargeTax = 0
                                }
                            }
                            if (element.category == "Service") {
                                if ($scope.taxSettingsForSettingPage.taxOnService == 1) {
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
                "isChargeTax": productBundleListCategory.isChargeTax  ? productBundleListCategory.isChargeTax : 0, 
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "duration": productBundleListCategory.duration ? productBundleListCategory.duration : '00:00'
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
                "isChargeTax": productBundleListCategory.isChargeTax  ? productBundleListCategory.isChargeTax : 0,
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "duration": productBundleListCategory.duration ? productBundleListCategory.duration : '00:00'
            };
            $scope.productBundleListNew.push(bundleObj);
            $scope.calculateBundleDurationTemp($scope.productBundleListNew);
        }
        $scope.chargeTax();
        $scope.isBundleSearch = false;
        $scope.bundleSearchForm = false;
        $scope.bundleCost = productBundleListCategory.cost;
        $scope.calculateBundleCostTemp(); 
    }

    function toSeconds(s,q) {
    var p = s.split(':');
    $scope.seconds = (parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60 + parseInt(p[2], 10)+$scope.seconds)*q;
    }

    function fill(s, digits) {
    s = s.toString();
    while (s.length < digits) s = '0' + s;
    return s;
    }

    $scope.calculateBundleDurationTemp = (productBundleListNew) => { 
        $scope.seconds = 0;
        productBundleListNew.forEach((productBundle) => {
            if(productBundle.category == 'Bundle') {
                productBundle.bundleItemReference.forEach((bundles) => {
                    if(!bundles.duration || bundles.duration == 'None'){
                        bundles.duration = '00:00:00';
                    }
                    toSeconds(bundles.duration,bundles.qty);
                });
            }
            else{
                if(!productBundle.duration || productBundle.duration == 'None'){
                    productBundle.duration = '00:00:00';
                }
                toSeconds(productBundle.duration, productBundle.qty);
            }
        });
        $scope.oneJobModel.job.duration = '2020-11-03T'+
        fill(Math.floor($scope.seconds / 3600), 2) + ':' +
        fill(Math.floor($scope.seconds / 60) % 60, 2) + ':' +
        fill($scope.seconds % 60, 2);
    }
    
    $scope.calculateBundleCostTemp = () => {
        if ($scope.productBundleListNew.length > 0 && !$rootScope.negativeCheckPassed($scope.productBundleListNew)) {
            $scope.errorProductForm = "The job template total can't be less than $0.00";
                setTimeout(function () {
                    $scope.errorProductForm = "";
                }, 2000);
                return false;
        }
        $scope.bundleSubTotal = 0;
        if( $scope.productBundleListNew.length > 0){
            $scope.calculateBundleDurationTemp($scope.productBundleListNew);
            angular.forEach($scope.productBundleListNew, function(value, key) {
                //value.qty = value.qty != 0 ? value.qty : 1;
                $scope.productBundleListNew[key].qty = parseFloat(value.qty);
                if((value.category == "Bundle" || value.category == "bundle") && value.bundleItemReference.length > 0){
                    var bundleItemTotal = 0;
                    angular.forEach(value.bundleItemReference, function(v, k) {
                        v.price = (typeof v.price === "number") ? v.price : parseFloat(v.price.replace(/[^0-9.-]/g, ''));
                        bundleItemTotal = bundleItemTotal + $rootScope.negativeRoundUp((v.price)*(v.qty));                    
                    });
                    $scope.productBundleListNew[key].price = bundleItemTotal;
                    bundleItemTotal = $rootScope.negativeRoundUp(bundleItemTotal * (value.qty));
                    $scope.bundleSubTotal = $scope.bundleSubTotal + bundleItemTotal;
                    $scope.bundleTotal = $scope.bundleSubTotal;

                }else{
                    value.price = (typeof value.price === "number") ? value.price : parseFloat(value.price.replace(/[^0-9.-]/g, ''));
                    $scope.bundleSubTotal = $scope.bundleSubTotal + $rootScope.negativeRoundUp((value.price)*(value.qty));
                    $scope.bundleTotal = $scope.bundleSubTotal;
                }
                
            })
            
        }
       
        $scope.updateDiscounts();
        let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
        $scope.bundleTotal = bundleTotal + $scope.taxValue; 
        if($scope.discountType == '%'){
            $scope.discountCalculation = (($scope.bundleSubTotal)*($scope.discountValue))/100;
            let taxValue = ($scope.getSubtotalForTax()) * ($scope.taxPercentValue)/100
            $scope.taxValue = taxValue;
            let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
            $scope.bundleTotal = bundleTotal + $scope.taxValue; 
        } else {
            let discountCalculation = $scope.bundleSubTotal-($scope.discountValue)+($scope.taxValue); 
            $scope.discountCalculation = $scope.discountValue;
            let taxValue = ($scope.getSubtotalForTax()) * ($scope.taxPercentValue)/100
            $scope.taxValue = taxValue;
            $scope.bundleTotal = discountCalculation;
        }
        if($scope.discountValue){
            $scope.discountTitle = $scope.discountValue+$scope.discountType;
        }

        $scope.updateDiscounts();
        $scope.updateTaxes();
        $scope.getSubtotalForTax();
    }

    $scope.updateTaxes = () => {
        if ($scope.taxPercentValue) {
            $scope.taxValue = ($scope.getSubtotalForTax())*($scope.taxPercentValue)/100;
            $scope.bundleTotal = ($scope.bundleSubTotal-($scope.discountCalculation))+($scope.taxValue);
        }
        $scope.getSubtotalForTax();
    }

    $scope.updateDiscounts = () => {
        if($scope.discountType == '%'){        
            $scope.discountCalculation = ($scope.bundleSubTotal*($scope.discountValue))/100;
            let bundleTotal = $scope.bundleSubTotal - ($scope.discountCalculation);
            $scope.bundleTotal = bundleTotal + ($scope.taxValue); 
        } else {
            let discountCalculation = $scope.bundleSubTotal-($scope.discountValue)+($scope.taxValue); 
            $scope.discountCalculation = $scope.discountValue;
            $scope.bundleTotal = discountCalculation;        
        }
        if($scope.discountValue){
            $scope.discountTitle = $scope.discountValue+($scope.discountType);
        }
        $scope.getSubtotalForTax();
    }

    $scope.selectJobStatus = (statusName) => {     
        $scope.statusName = statusName.statusName;
        $scope.statusId = statusName.id;
        if($scope.statusId == 4){
            $scope.statusComplete = true;
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
    }

    $scope.selectwaterBodyOption = (selectwaterBodyId, selectwaterBody) => { 
        $scope.selectwaterBody = selectwaterBody
        $scope.waterBodyListId = selectwaterBodyId;
    }

    $scope.selectTimeOption = (jobTimeId) => { 
        $scope.selectTime = jobTimeId.period +" "+ jobTimeId.startTime +" "+ jobTimeId.endTime;
        $scope.jobTimeId = jobTimeId.id;
    }

    $scope.selectPayOption = (payOption) => {
        $scope.payOption = payOption.option;
        $scope.payId = payOption.id;
    }

    $scope.selectTax = (companyId) => {
        if (companyId.title && companyId.amount) {
            $scope.taxTitle = companyId.title;
            $scope.taxPercentValue  = companyId.amount;
            $scope.taxValue = ($scope.getSubtotalForTax())*($scope.taxPercentValue)/100;
            $scope.bundleTotal = $scope.bundleSubTotal-($scope.discountCalculation)+($scope.taxValue);         
            $scope.getTrimmedVals();    
        }    
    }

    $scope.templateNameOption = (templateNameNew) => {  
        $scope.templateNameNew = templateNameNew.templateName;
        $scope.templateId = templateNameNew.id;
        apiGateWay.get("/one_job_template_v2", {
            id: templateNameNew.id,
        }).then(function(response) {            
            if (response.data.status == 200) {    
                let templateData = response.data.data;             
                $scope.oneJobModel = {
                    "job": {
                        "addressId": 61821869,
                        "dueDate": "2021-08-07",
                        "duration": templateData.duration,
                        "instruction": templateData.instruction,
                        "jobId": 45833,
                        "jobStatus": 1,
                        "jobTitle": templateData.title,
                        "note": templateData.officeNote,
                        "tempJobId": "7043",
                        "templateId": 11,
                        "timeId": 0,
                        "waterBodyId": 0,
                    },
                };
                setTimeout(function() {
                    $scope.saveOneTimeJob();
                }, 2000);
                
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
            closeByEscape: false,
            closeByDocument: false,
        });
    };

    $scope.updateDiscountType = function(value){
        $scope.discountType = value;
        if($scope.discountType == '%'){
            let discountCalculation = $scope.bundleSubTotal*$scope.discountValue/100;
            $scope.discountCalculation = discountCalculation;
            bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation+$scope.taxValue; 
            $scope.bundleTotal = bundleTotal;
        } else {
            if($scope.discountValue){            
                discountCalculation = $scope.bundleSubTotal-$scope.discountValue+$scope.taxValue; 
                $scope.discountCalculation = $scope.discountValue;
                $scope.bundleTotal = discountCalculation;
            }
        }
        $scope.getSubtotalForTax();
    }

    $scope.showDiscountValue = function(discountValue) {  
        $scope.discountValue = discountValue;
        if($scope.discountValue){
            if($scope.discountType == '%'){
                $scope.discountCalculation = ($scope.bundleSubTotal*$scope.discountValue)/100;
                let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
                $scope.bundleTotal = bundleTotal + $scope.taxValue; 
                $scope.discountTitle = $scope.discountValue+$scope.discountType;
            } else {
                discountCalculation = $scope.bundleSubTotal-$scope.discountValue+$scope.taxValue; 
                $scope.discountCalculation = $scope.discountValue;
                $scope.bundleTotal = discountCalculation;
            }
        }
        $scope.getSubtotalForTax();
    }

    $scope.addTaxJob = function(){
        let taxValue = ($scope.getSubtotalForTax())*$scope.taxPercentValue/100;
        $scope.taxValue = taxValue;
        if($scope.discountValue != ""){
            if($scope.addProductPopup){
                $scope.addProductPopup.close();
            }else{
                ngDialog.close();
            }
            if($scope.discountType == '%'){
                $scope.discountCalculation = ($scope.bundleSubTotal*$scope.discountValue)/100;
                let bundleTotal = $scope.bundleSubTotal - $scope.discountCalculation;
                $scope.bundleTotal = bundleTotal + $scope.taxValue; 
                $scope.discountTitle = $scope.discountValue+$scope.discountType;
            } else {
                let discountCalculation = $scope.bundleSubTotal-$scope.discountValue+$scope.taxValue; 
                if(discountCalculation < 0){
                    $scope.errorDiscount = true;
                    setTimeout(function() {
                        $scope.errorDiscount = false;
                    }, 2000); 
                    $scope.discountCalculation = "";
                    $scope.bundleTotal = $scope.bundleSubTotal+$scope.taxValue; 
                } else {
                    $scope.errorDiscount = false;
                    $scope.discountCalculation = $scope.discountValue;
                    $scope.bundleTotal = discountCalculation;
                }

                
            }
                
			
        }
        $scope.getSubtotalForTax();
    }

    $scope.removeDiscount = function(){
        $scope.discountValue ="";
        $scope.discountCalculation = $scope.bundleSubTotal*$scope.discountValue/100;
        let taxValue = ($scope.getSubtotalForTax()) * $scope.taxPercentValue/100
        $scope.taxValue = taxValue;
        $scope.bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation+$scope.taxValue; 
        $scope.discountTitle = "";
        $scope.getSubtotalForTax();
    }

    $scope.removeTax = function(){
        $scope.taxTitle = "";
        $scope.taxPercentValue  = 0;
        $scope.taxValue = $scope.bundleSubTotal*$scope.taxPercentValue/100;
        $scope.bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation+$scope.taxValue; 
        $scope.getSubtotalForTax();
    }

    $scope.closeTaxJob = function(){
        if($scope.addProductPopup){
            $scope.addProductPopup.close();
        }else{
            ngDialog.close();
        }
        $scope.discountTitle = "";
        $scope.discountValue = 0;
        $scope.discountCalculation = $scope.bundleSubTotal*$scope.discountValue/100;
        $scope.bundleTotal = $scope.bundleSubTotal-$scope.discountCalculation;   
        $scope.getSubtotalForTax();
    }

    $rootScope.deleteJob = function(jobId){
        $scope.isProcessing = true;
        apiGateWay.send("/delete_job", {
            "jobId": jobId
        }).then(function(response) {
            if (response.data.status == 200) {
                $scope.changeStatus($scope.addressId);
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

    $rootScope.mailPdf = function(email) {
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
    
    $rootScope.oneTimeJobSettingData = {};
    $scope.oneTimeJobSetting = function() {
        $rootScope.settingPageLoaders.jobScheduleSection = true;
        $rootScope.oneTimeJobSettingData = {};
        apiGateWay.get("/one_job_setting").then(function(response) {
            if (response.data.status == 200) {  
                $rootScope.oneTimeJobSettingData = response.data.data;
                $scope.customTemplate = response.data.data.customTemplate; 
                angular.forEach($scope.customTemplate, (element, index) => {
                    $scope.customTemplateId = element.id;
                });
                $scope.systemTempate = response.data.data.systemTempate; 
                angular.forEach($scope.customTemplate, (element, index) => {
                    $scope.systemTempateId = element.id;
                });
            } 
            $rootScope.settingPageLoaders.jobScheduleSection = false;
        });
    }

    $scope.removeTemplateConfirm = function(customTemplateId, index){
        $scope.customTemplateId = customTemplateId;
        $scope.index = index;
        ngDialog.open({
            template: 'removeTemplateConfirmPopup.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
        });
      }
    
        $scope.removeTemplate = function(customTemplateId, index){
            apiGateWay.send("/delete_template", {
                "id": customTemplateId.id
            }).then(function(response) {
                if (response.data.status == 200) {
                    $scope.oneTimeJobSetting();            
                    ngDialog.close();
                }
            }, function(error){
                $scope.isProcessing = false;
            })
            
       }

    $scope.editJobTemplate = function(customTemplateId){
        $rootScope.disableBackwashChecklist = false;
        $rootScope.disableBackwashChecklistText = '';
        $rootScope.disableFilterCleanedChecklist = false;
        $rootScope.disableFilterCleanedChecklistText = '';
        $rootScope.disableSaltCellCleanedChecklist = false; 
        $rootScope.disableFilterCleanedChecklistText = '';
        $rootScope.eqTempelateId='';
		$scope.successProductForm = ""; 
        $scope.errorProductForm = "";	
        $scope.addJobTemplateTrue = false;
        $scope.editTemplate = true;
        $scope.editFilterTemplate = false; 
        $scope.templateId = customTemplateId;
        $rootScope.templateId = customTemplateId;
        $rootScope.oneJobTemplate = true;
        $scope.isBundleSearch = false;
        apiGateWay.get("/one_job_template_v2", {
            id: customTemplateId,
        }).then(function(response) {            
            if (response.data.status == 200) {
                ngDialog.open({
                    template: 'addJobTemplate.html',
                    className: 'ngdialog-theme-default v-center',
                    scope: $scope,
                    closeByEscape: false,
                    closeByDocument: false,
                    preCloseCallback: function() {
                        $scope.productEdit = false; 
                        $scope.isBundleSearch = false;
                        $scope.productBundleListNew = [];
                        $scope.productBundleListNewCategory = [];
                    },
                    
                }); 
                
                if(response.data.data.duration == "Invalid date" || response.data.data.duration == null || (response.data.data.duration && !response.data.data.duration.includes(':'))){
                    var duration = "2014-02-27T00:00";
                } else {
                    if(response.data.data.duration){
                        var duration =  "2014-02-27T"+response.data.data.duration;
                    } else {
                        var duration = "2014-02-27T00:00";
                    }
                }
                
                
                $scope.oneJobModel={
                    "job":{                            
                        "duration": duration,
                        "instruction": response.data.data.instruction,
                        "jobTitle": response.data.data.title,
                        "note": response.data.data.officeNote,
                        "status":1,
                        "templateName": response.data.data.templateName
                    },
                };  
            } else {
                $scope.productNoItem = true;               
            }
        });  

        apiGateWay.get("/one_job_item", {
            jobId: customTemplateId,
            isTemplate:1
        }).then(function(response) {            
            if (response.data.status == 200) {  
                bundleSubTotal = response.data.data.subTotalAmount;                
                if(bundleSubTotal == "null"){
                    $scope.bundleSubTotal = bundleSubTotal;
                } else {
                    $scope.bundleSubTotal = 0;
                }
                let productBundleListNew = response.data.data.productAndService;
                if(productBundleListNew){
                    $scope.productBundleListNew = productBundleListNew; 
                    $scope.productBundleListNewCategory = response.data.data.productAndService.category; 
                } else {
                    $scope.productNoItem = true;
                }  
                
                $scope.payOptionData = response.data.data.payOption;
                  angular.forEach($scope.payOptionData, (element, index) => {
                    $scope.payOption = element.option;
                    $scope.payId = element.id;
                  });
                if(response.data.data.discountTitle){
                    $scope.discountTitle = response.data.data.discountTitle;
                }
                
                $scope.discountCalculation = response.data.data.discountValue ? response.data.data.discountValue : 0;
                $scope.bundleTotal = response.data.data.totalAmount ? response.data.data.totalAmount : 0;
                $scope.bundleSubTotal = response.data.data.subTotalAmount ? response.data.data.subTotalAmount : 0;

                $scope.taxData = response.data.data.taxData;
                angular.forEach($scope.taxData, (element, index) => {
                    $scope.companyId = element.companyId;
                });
                if(response.data.data.taxValue){
                    $scope.taxValue = response.data.data.taxValue;
                } else{
                    $scope.taxValue = "";
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
                    }
                } else {
                    $scope.discountValue = "";
                    $scope.discountTitle = "";
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

                // $scope.chargeTax();
                $scope.getSubtotalForTax();
            } else {
                $scope.productNoItem = true;               
            }
        });
        
    }


    $(document).ready(function() {
        $('.input-daterange').datepicker();
        $('.duration').mask('00:00');
    });
    $scope.taxableSubtotal = 0;
    $scope.getSubtotalForTax = function () {     
        var totalAmountForApplyTax = 0;
        $scope.taxableSubtotal = 0;
        if ($scope.discountCalculation > 0) {
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.lineItemTaxableAmount = 0;
                if (element.isChargeTax == 1 && element.category !== 'Bundle') {
                    element.price = (typeof element.price === "number") ? element.price : parseFloat(element.price.replace(/[^0-9.-]/g, ''));
                    var itemAmount = $rootScope.negativeRoundUp((element.qty) * (element.price));
                    var itemsContributionPercent = (((itemAmount/($scope.bundleSubTotal))*100));
                    var discountOnThisItem = $rootScope.negativeRoundUp((($scope.discountCalculation*(itemsContributionPercent))/100));
                    var itemAmountAfterDiscount = $rootScope.negativeRoundUp(itemAmount-(discountOnThisItem));
                    totalAmountForApplyTax = $rootScope.negativeRoundUp(totalAmountForApplyTax + (itemAmountAfterDiscount));
                    element.lineItemTaxableAmount = itemAmountAfterDiscount;
                }
                if (element.bundleItemReference && element.bundleItemReference.length) {
                    var bundleTaxableAmount = 0;
                    angular.forEach(element.bundleItemReference, (element2, index2) => {
                        element2.lineItemTaxableAmount = 0;
                        if (element2.isChargeTax == 1) {
                            element2.price = (typeof element2.price === "number") ? element2.price : parseFloat(element2.price.replace(/[^0-9.-]/g, ''));
                            var itemAmount = $rootScope.negativeRoundUp((element2.qty) * (element2.price));
                            var itemsContributionPercent = (((itemAmount/($scope.bundleSubTotal))*100));
                            var discountOnThisItem = $rootScope.negativeRoundUp((($scope.discountCalculation*(itemsContributionPercent))/100));
                            var itemAmountAfterDiscount = $rootScope.negativeRoundUp(itemAmount-(discountOnThisItem));
                            totalAmountForApplyTax = $rootScope.negativeRoundUp(totalAmountForApplyTax + (itemAmountAfterDiscount));
                            element2.lineItemTaxableAmount = itemAmountAfterDiscount;
                            bundleTaxableAmount = bundleTaxableAmount + (itemAmountAfterDiscount);
                        }
                    });
                    element.lineItemTaxableAmount = bundleTaxableAmount;
                }
            });
        } else {
            angular.forEach($scope.productBundleListNew, (element, index) => {
                element.lineItemTaxableAmount = 0;                
                if (element.isChargeTax == 1 && element.category !== 'Bundle') {
                    element.price = (typeof element.price === "number") ? element.price : parseFloat(element.price.replace(/[^0-9.-]/g, ''));
                    totalAmountForApplyTax = totalAmountForApplyTax + $rootScope.negativeRoundUp((element.qty) * (element.price));
                    element.lineItemTaxableAmount = $rootScope.negativeRoundUp((element.qty) *( element.price));
                }
                if (element.bundleItemReference && element.bundleItemReference.length) {
                    var bundleTaxableAmount = 0;
                    angular.forEach(element.bundleItemReference, (element2, index2) => {                        
                        element2.lineItemTaxableAmount = 0;
                        if (element2.isChargeTax == 1) {
                            element2.price = (typeof element2.price === "number") ? element2.price : parseFloat(element2.price.replace(/[^0-9.-]/g, ''));
                            var amount = $rootScope.negativeRoundUp((element2.qty) * (element2.price));
                            totalAmountForApplyTax = totalAmountForApplyTax + (amount);
                            element2.lineItemTaxableAmount = amount;
                            bundleTaxableAmount = bundleTaxableAmount + (amount);
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
        if ($scope.taxTitle != '') {
            $scope.chargeTax();        
        }
    });
    $scope.$watch('discountCalculation', function() {            
        $scope.getTrimmedVals();
    });
    $scope.$watch('taxValue', function() {            
        $scope.getTrimmedVals();
    });
    $scope.defaultTax = {};
    $scope.chargeTax = function() {
        angular.forEach($rootScope.taxSettingsForSettingPage.taxData, function(item, index){ 
            if(item.isDefault==1){
              $scope.defaultTax = item;
            }
          });
          if ($scope.taxTitle == '' || $scope.taxTitle === undefined || $scope.taxTitle === null) {
            var companyId = {
                title: $scope.defaultTax.title,
                amount: $scope.defaultTax.amount,
            }
            $scope.selectTax(companyId)
        } else {
            var companyId = {
                title: $scope.taxTitle,
                amount: $scope.taxPercentValue,
            }
            $scope.selectTax(companyId)
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
        // ooj-on-setting
        // if isNaN
        $scope.bundleSubTotal = isNaN($scope.bundleSubTotal) ? 0 : $scope.bundleSubTotal;
        $scope.taxableSubtotal = isNaN($scope.taxableSubtotal) ? 0 : $scope.taxableSubtotal;
        $scope.discountCalculation = isNaN($scope.discountCalculation) ? 0 : $scope.discountCalculation;
        $scope.taxValue = 0;
        // trimmed
        $scope.trimmedData.subtotal = $rootScope.negativeRoundUp($scope.bundleSubTotal);
        $scope.trimmedData.taxableSubtotal = $rootScope.negativeRoundUp($scope.taxableSubtotal);
        $scope.trimmedData.discount = $scope.roundUpAtHundreds($scope.discountCalculation);
        $scope.trimmedData.tax = 0;
        $scope.trimmedData.total = $rootScope.negativeRoundUp(($scope.trimmedData.subtotal - $scope.trimmedData.discount) + ($scope.trimmedData.tax));
        // reAssign to scope
        $scope.bundleSubTotal = $scope.trimmedData.subtotal;
        $scope.taxableSubtotal = $scope.trimmedData.taxableSubtotal;
        $scope.discountCalculation = $scope.trimmedData.discount;
        $scope.taxValue = 0;
        $scope.bundleTotal = $scope.trimmedData.total;
    }
});
