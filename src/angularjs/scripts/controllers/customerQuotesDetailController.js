angular.module('POOLAGENCY')

.controller('customerQuotesDetailController', function($rootScope, $scope, $state, $stateParams, apiGateWay, $filter, $window, ngDialog, $timeout, $http, commonService, configConstant, auth, pendingRequests, AwsS3Utility, AwsConfigService, $location, DecryptionService) {
    //$rootScope, $scope,$window, Carousel, deviceDetector, $timeout, $filter, $sce, apiGateWay, service, $state, $stateParams, ngDialog, Analytics, configConstant, auth
    //https://www.checksnforms.com/ENV-1-Double-Window-Envelopes-p/env%201.htm?gclid=Cj0KCQiA9P__BRC0ARIsAEZ6irhfy3yEaz1q7b30QE1QkHLBy7GeNyz_7myyFoBHpYieezV68WzaYn8aAsYTEALw_wcB
    
    $scope.$window = $window;
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.env = configConstant[$scope.selectedEvn];
    $scope.payaConfig = {};
    $scope.addressId = $stateParams.addressId;
    if ($state.current.name == 'quotesWithKey') {
        $scope.qID = $location.search().q;
        $scope.qID = decodeURIComponent($scope.qID);
        $scope.qID = $scope.qID.replaceAll(' ', '+');
        let qData = DecryptionService.decrypt($scope.qID);
        if (qData) {
            let splitData = qData.split('/');
            $scope.companyId = splitData[0];
            $scope.quotesId = splitData[1];
        } else {
            console.error("Decryption failed or string is invalid");
        }
    } else {
        $scope.companyId = $stateParams.companyId ? $stateParams.companyId : (auth.getSession() ?auth.getSession().companyId : '');
        $scope.quotesId = $stateParams.quoteId? $stateParams.quoteId : 0;   
    }
    $scope.IsVisible = false;
    $scope.serviceAddressId = '';
    $scope.IsIndVisible = [];
    $scope.IsTextFieldVisible = [];
    $scope.IsLableFieldVisible = [];
    $scope.IsBunddleVisible = [];
    $scope.lineUnitPrice = [];
    var a = [];
    $scope.IsBunddleVisible.push(a);
    $scope.quotesDetails = {};
    $scope.customerDetails = {};
    $scope.sentOnData = [];
    $scope.errorProductFormQty = [];
    $scope.errorItemFormQty = [];
    $scope.errorItemFormQty.push(a);
    $scope.viewedOnData = [];
    $scope.paymentProfiles = [];
    $scope.date = new Date();
    $scope.model ={
        paymentMethod : '',
        notes: '',
        transaction_amount:''
    }
    $scope.companyTimeZone = '';
    $rootScope.qd_companyTimeZone = '';
    $scope.sentEmailModel = {
        email:''
    };
    $scope.quotesModel = {
        quotesTitle:'',
        quotesNotes:'',
        officeNotes:'',
        techNotes:'',
        status:'',
        statusNote:'',
        //discountTitle: '',
        //discountValue: ''
    }
    $scope.statusMapData = ['Open', 'Approved', 'Denied', 'Closed'];
    $scope.lableMapData = ['Required', 'Optional', 'Important', 'Recommended'];
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
    $scope.isNoAuthPage = true;
    $scope.selectedPaymentMethod = '';
    $scope.customerTaxData = {"taxSettingArray":[],"taxDataPopup":false, "selectedTaxId":null, "selectedTaxAmount":0, "addTaxButton":true};
    $scope.customerDiscountData = {"discountDataShow":false, "discountDataUpdated":false, "discountAmount":0, "discountValue":0, "DiscountTitle":"", "dtype":"%","addDiscountButton":false, "errorMsg":""};
    $scope.quotesNotFoundStatus = true;
    $scope.discountUpdating = false;
    if($state.current.name !='quotes' && $state.current.name != 'quotesWithKey'){
        $scope.isNoAuthPage = false;
        //$state.go("app.customerinvoicedetail",{ invoiceId: $scope.invoiceId}, {reload: false});
    }
    $scope.directPayment = false;
    $scope.payaErrorCode = "";
    $scope.selectedStatusForAPI = '';
    $scope.isAlertOpened = false;

    $scope.saveOneTimeJob = false;
    $scope.isBundleSearch = false;
    $scope.bundleSearchForm = false;

    $scope.bundleSearchListNew = '';
    $scope.lineData = [];
    $scope.productNoItem = false;

    $scope.productBundleList = {};
    $scope.productBundleListCategory = "";
    $scope.bundleCost  = "";
    $scope.waterBodyList = {};
    $scope.waterBodyListName = "";
    $scope.waterBodyName ="";
    $scope.waterBodyListId = "";
    $scope.bundleTotal = 0;
    $scope.bundleSubTotal = 0;
    $scope.costBundleTotal = 0;
    $scope.bundleQtyText = "1";
    $scope.bundleCost  = "";
    $scope.bundleQtyPrice = "";
    $scope.qtyBundle = "";
    $scope.jobStatusIcon = '';
    $scope.addNote = '';
    $scope.quotesType = 'OneOffJob';
    $scope.showAddProduct = true;
    $scope.showItemPrint = true;
    $scope.quotesAuthCompany = auth.getSession().companyId;
    $scope.existPaymentValue = false;
    $scope.emit = false;
    $scope.bundleItemTotal = [];
    $scope.isStatusAPIhitted = false;
    $scope.techId = 0;
    $scope.techSearchKey = '';
    $scope.techSearchBox = {techSearchText:''};
    $scope.techSearchKeyQuotes = '';
    $scope.techSearchBoxQuotes = {techSearchText:''};
    // $scope.bodyOfWaterList = [
    //     'POOL','FOUNTAIN','SPA','OTHER'
    // ];
    //$scope.selectedWaterBody = 'POOL';

    $scope.selectwaterBody = 'Select';
    $scope.techId = 0;
    $scope.technicianList = [];
    $scope.technicianListQuotes = [];
    $scope.technicianLoaded = false;
    $scope.isTechProcessing = true;
    $scope.historyProcessing = false;
    $scope.statusHistoryData = [];
    $scope.defaultTaxSettingData = {};
    // globalQuoteSettings
    $scope.globalQuoteSettings = {
        isNotesRequired: 0
    };
    $scope.jobTechnician = null;
    $scope.saleTechnician = null;
    $scope.showCommision = false;
    $scope.showCommisionText = "view details";
    $scope.permissions = {};
    $scope.isCommission='True';
    if (auth.getSession()) {
        $scope.permissions = auth.getSession();
    }
    $scope.noLineItem = false;
    // globalQuoteSettings
    $scope.quotesDetailsLoaded = false;
    $scope.quoteAuditList = [];
    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createTime';
    $scope.quoteLogLoading = false;
    $scope.getQuotesDetails = function(updateDiscount = false, inIt= false) {
            if ($rootScope.isNPPCompany()) {
                return
            }
            $scope.quotesDetailsLoaded = false;
            $scope.existPaymentValue = false;
            $scope.isProcessing = true;
            $scope.jobArray = [];
            $scope.jobArrayGroup = [];

            let apiURL = '/quote_details';
            if($scope.isNoAuthPage){
                apiURL = '/public_quote_details';
            }

            apiGateWay.get(apiURL, {id:$scope.quotesId, companyId:$scope.companyId}).then(function(response) {
                if (response.data.status == 200) {

                    if(!response.data.data.data || !response.data.data.data.quoteNumber){
                        $rootScope.qd_assignedData = '';

                        $scope.quotesNotFoundStatus = true;
                        $scope.quotesNotFoundText = 'Quotes Not Found';
                    } else {
                        $scope.quotesNotFoundStatus = false;
                            $scope.quotesNotFoundText = '';

                        if(!$scope.isNoAuthPage){
                            $scope.getCompanySetting();
                        }
                        $scope.selectedWaterBody = response.data.data.data.bodyOfWater || 'POOL';
                        $scope.companyTimeZone = response.data.data.companyTimeZone;
                        $rootScope.qd_companyTimeZone = response.data.data.companyTimeZone;
                        $scope.moment = moment;
                        // old images handler
                        if (response.data.data.data && response.data.data.data.details && response.data.data.data.details[0]) {
                            if (response.data.data.data.details[0].lineData && response.data.data.data.details[0].lineData.length) {
                                response.data.data.data.details[0].lineData.forEach(function(lineitem, index){
                                    if (lineitem.photos && lineitem.photos.length > 0) {
                                        lineitem.photos.forEach(function(photo, photoIndex){
                                            if (photo.fileName && !photo.fileName.includes('.')) {
                                                photo.isOldMethod = true
                                            }
                                        })
                                    }
                                })
                            }
                        }
                        // old images handler    
                        $scope.quotesDetails = response.data.data.data;                                            
                        $scope.addressId = $scope.quotesDetails.serviceAddressId;                                            
                        $scope.getQuoteTemplatesListOnQuotePage(response.data.data.data.templateId ? response.data.data.data.templateId : 0);
                        if ($scope.quotesDetails.primaryAddressDetails && $scope.quotesDetails.primaryAddressDetails.email) {
                            $scope.questionModel.emailForReplyAskedQuestion = $scope.quotesDetails.primaryAddressDetails.email;
                            $scope.cachedEmailForReplyAskedQuestion = angular.copy($scope.questionModel.emailForReplyAskedQuestion);
                        }
                        $scope.noLineItem = $scope.quotesDetails.details[0].lineData.length == 0 ? true : false;
                        if(!$scope.isNoAuthPage){ $scope.getQuoteCommisions(); }
                        $scope.defaultTaxSettingData = response.data.data.data.defaultTaxSettingData;

                        $scope.quotesModel.quotesNotes = $scope.quotesDetails.quotesNotes;
                        $scope.quotesModel.officeNotes = $scope.quotesDetails.officeNotes;
                        $scope.quotesModel.techNotes = $scope.quotesDetails.techNotes;
                        $scope.customerTaxData.selectedTaxValue = $scope.quotesDetails.taxValue;
                        $scope.customerTaxData.selectedTaxTitle = $scope.quotesDetails.taxTitle;

                        $scope.customerDiscountData.discountAmount = $scope.quotesDetails.discountValue;
                        $scope.customerDiscountData.discountValue = $scope.quotesDetails.discountValue;
                        $scope.customerDiscountData.discountTitle = $scope.quotesDetails.discountTitle;

                        if($scope.quotesDetails.discountValue>0 || $scope.quotesDetails.discountTitle){
                            $scope.customerDiscountData.discountDataUpdated = true;
                        }

                        if($scope.quotesDetails.taxValue>0 || $scope.quotesDetails.taxTitle){
                            let valueFromTitle = $scope.customerTaxData.selectedTaxTitle.split("(");
                            valueFromTitle = valueFromTitle[valueFromTitle.length-1].split("%");
                            if ($scope.customerTaxData.selectedTaxAmount > 0) {
                                $scope.customerTaxData.selectedTaxAmount =  Number(valueFromTitle[0]);
                            }
                        }

                        // if($scope.quotesDetails.taxValue == 0 && $scope.customerTaxData.selectedTaxTitle != ''){
                        //     $scope.customerTaxData.addTaxButton = false;
                        // }
                        if($scope.quotesDetails.discountTitle==""){
                            $scope.customerDiscountData.addDiscountButton = true;
                            $scope.customerTaxData.addTaxButton = true;
                        }

                        if($scope.quotesDetails.invoiceStatus == "Paid"){
                            $scope.customerDiscountData.addDiscountButton = false;
                            $scope.customerTaxData.addTaxButton = false;
                        }


                        if($scope.quotesDetails.details && $scope.quotesDetails.details.length > 0){
                            angular.forEach($scope.quotesDetails.details, function(detail, parentIndex){
                                if(detail.serviceDetails && detail.serviceDetails.length > 0){
                                    angular.forEach(detail.serviceDetails, function(item, index){
                                        $scope.quotesDetails.details[parentIndex].serviceDetails[index].chemicalDetails = []
                                        $scope.quotesDetails.details[parentIndex].serviceDetails[index].chemicalDetails = $scope.chemicalReadingArray(item.jobDetails);
                                    })
                                }
                            })
                            $scope.productServices = [];
                            angular.forEach($scope.quotesDetails.details[0].lineData, function(itemdetail, itemindex){
                                if(itemdetail.qty==0 || !itemdetail.qty || itemdetail.qty=='') {
                                    $scope.quotesDetails.details[0].lineData[itemindex].qty = 1;
                                }
                                if(itemdetail.unitPrice==0 || !itemdetail.unitPrice || itemdetail.unitPrice=='') {
                                    $scope.quotesDetails.details[0].lineData[itemindex].unitPrice = $scope.quotesDetails.details[0].lineData[itemindex].amount;
                                }
                                    // Created the list of all exists product service items - remove from dropdown
                                    $scope.productServices.push(itemdetail.title);
                                    // End

                            })

                        }
                        // $scope.invoiceModel.discountTitle = $scope.quotesDetails.discountTitle;
                        // $scope.invoiceModel.discountValue = $scope.quotesDetails.discountValue;
                        $scope.sentOnData = response.data.data.sentOnData;
                        $scope.viewedOnData = response.data.data.viewedOnData;
                        $scope.quotesModel.status = $scope.quotesDetails.status;
                        $rootScope.quotesModelStatus = $scope.quotesDetails.status;
                        $scope.quotesModel.statusNote = $scope.quotesDetails.statusNote;
                        $scope.quotesModel.quotesTitle = $scope.quotesDetails.title
                        $scope.selectwaterBody = $scope.quotesDetails.waterBodyName;
                        if(!$scope.isNoAuthPage && $scope.quotesDetails && $scope.quotesDetails.companyId){
                            $rootScope.showCompanyById($scope.quotesDetails.companyId);
                        }
                        try {
                            $scope.sentEmailModel.email = $scope.quotesDetails.length > 0 && quotesDetails.billingDetails ? $scope.quotesDetails.billingDetails.email : '';
                        } catch (error) {
                        }
                        let website = $scope.quotesDetails.companyDetails.website;
                        $scope.quotesDetails.companyDetails.website = website && website.search("http:") == -1 && website.search("https:") == -1 ? 'http://'+website : website;
                        // $rootScope.quotesDate = $scope.quotesDetails.quoteDate
                        $rootScope.quotesDate = $scope.quotesDetails.createdOn
                        $rootScope.qd_quoteNo = $scope.quotesDetails.quoteNumber;
                        if ($scope.quotesDetails.technicianId) {
                            $scope.techId = $scope.quotesDetails.technicianId;
                        }
                        if($scope.quotesDetails.technicianDetails != null){
                            $rootScope.qd_assignedData = '<span class="remove-for-print qoute-header-subtitle"><span class="not-clickable-text">Assigned to </span><span class="tech-user-name">'+$scope.quotesDetails.technicianDetails.firstName+' '+$scope.quotesDetails.technicianDetails.lastName+'</span></span>';
                            // $rootScope.qd_assignedData = '';
                        }else{
                            $rootScope.qd_assignedData = '<span class="remove-for-print qoute-header-subtitle qoute-header-unassign">Assign technician to this quote</span>';
                            // $rootScope.qd_assignedData = '';
                        }


                    }
                    if(updateDiscount == true){
                        $scope.discountValueChange();
                        $scope.saveDiscount(false);
                        $scope.taxSelected($scope.customerTaxData.selectedTaxId, false);
                    }
                } else {
                    $scope.quotesDetails = {};
                    $scope.invoiceModel.invoiceNotes = '';
                    //  $scope.invoiceModel.discountValue = '';
                    // $scope.invoiceModel.discountTitle = '';

                    $scope.sentOnData = [];
                    $scope.viewedOnData = [];
                }
                $scope.quotesDetailsLoaded = true;
                $scope.lineUnitPrice = [];
                $scope.isProcessing = false;
                $scope.isTotalProcessing = false;
                $scope.discountUpdating = false;
            },function(error){
                $scope.quotesDetailsLoaded = true;
                $scope.isProcessing = false;
                $scope.isTotalProcessing = false;
                $scope.discountUpdating = false;
            });

            
    };

    $scope.printQuotes = function(){
        $scope.showItemPrint = false;
        setTimeout(function(){
     $scope.$window.print();
        $scope.showItemPrint = true;
        },500);


    }
    // $scope.selectwaterBodyOption = function(v){
    //     $scope.selectedWaterBody = v;
    //     $scope.updateWaterBody();
    // }
    $scope.updateWaterBody = function(){
        $scope.isProcessing = true;
        let formData = {
            "id":$scope.quotesId,
            // "action":"Edit",
            // "customerId":$scope.quotesDetails.customerId,
            "addressId":$scope.quotesDetails.serviceAddressId,
            "bodyOfWater":$scope.waterBodyListId
            //"bodyOfWater":$scope.selectedWaterBody
        };
        apiGateWay.send("/quotes", formData).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductForm = 'Body of water updated.';
                $scope.getQuotesDetails()
            } else {
                $scope.errorProductForm = 'Some error occured. Please try again.'
            }
            $scope.isProcessing = false;
            setTimeout(function(){
                $scope.errorProductForm = '';
                $scope.successProductForm = '';
            }, 2000)
        },function(error) {
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function(){
                $scope.errorProductForm = '';
                $scope.successProductForm = '';
            }, 2000)
        });
    }
    $rootScope.duplicateQuote = function(){
        $scope.isProcessing = true;
        $rootScope.isCopyingQuote = true;
        apiGateWay.get("/copy_quote?id=" + $scope.quotesId).then(function(response) {
            if (response.data.status == 200) {
                $scope.copyQuoteImage(response.data.data.newQuoteId)
            } else {
                $scope.errorProductForm = 'Some error occured. Please try again.'
            }
            setTimeout(function(){
                $scope.errorProductForm = '';
                $scope.successProductForm = '';
            }, 2000)
        },function(error) {
            $scope.isProcessing = false;
            $rootScope.isCopyingQuote = false;
            $scope.errorProductForm = error;
            setTimeout(function(){
                $scope.errorProductForm = '';
                $scope.successProductForm = '';
            }, 2000)
        });
    }
    $scope.openStatusHistoryModal = function() {
        $scope.getStatusHistory();
        ngDialog.open({
            id  : 11,
            template: 'statusHistory.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {

            }
        });
    }
    $scope.getStatusHistory = function() {
        $scope.historyProcessing = true;
        let fData = {
            quotesId: $scope.quotesId
        }
        apiGateWay.send("/quotes_status_history", fData).then(function(response) {
            $scope.statusHistoryData = [];
            if (response.data.status == 200 && response.data.data.data.length > 0) {
                $scope.statusHistoryData = response.data.data.data;
            }
            $scope.historyProcessing = false;

        },function(error) {
            $scope.historyProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function(){
                $scope.errorProductForm = '';
            }, 2000)
        });
    }
    /* zzzzz Assign Technician*/
    $rootScope.qdOpenAssignTechnicianPopup = function(){
        if ($scope.quotesDetails.status === "Open") 
        {
          $scope.getTechnicianList();
          ngDialog.open({
            id: 11,
            template: "assignTechnician.html",
            className: "ngdialog-theme-default v-center",
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
              $scope.techSearchBox.techSearchText = "";
              $scope.techSearchKey = "";
              $scope.isProcessing = false;
            },
          });
        }
    }

    $scope.getTechnicianList = function() {
        $scope.technicianList = [];
        // $scope.isTechProcessing = true;
        var paramObj = {status: 'Active', offset: 0, limit: 30, searchKey:$scope.techSearchKey};
        apiGateWay.get("/technicians", paramObj).then(function(response) {
            if (response.data.status == 200) {
                var technicianListResponse = response.data.data;
                $scope.technicianList = technicianListResponse.data;
                $scope.technicianLoaded = true;
            } else {
                $scope.technicianList = [];
            }
            // $scope.isTechProcessing = false;
        }, function(error){
            // $scope.isTechProcessing = false;
            })
    };
    
    var tempFilterText = '', filterTextTimeout;
    $scope.searchTech = function(searchText){
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        if(searchText == $scope.techSearchKey || (searchText == $scope.techSearchKey && !searchText)){
            return false;
        }
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);

        tempFilterText = searchText;
        filterTextTimeout = $timeout(function() {
            $scope.techSearchKey = tempFilterText;
            $scope.getTechnicianList()
        }, 500); // delay 250 ms
    }

    $scope.assignTechnician = function(id){
        $scope.isProcessing = true;
        let formData = {
            "id": $scope.quotesId,
            "technicianId": id,
            "addressId":$scope.quotesDetails.serviceAddressId,
        };
        apiGateWay.send("/quotes", formData).then(function(response) {
            if (response.data.status == 200) {
                $scope.techId = id;
                if (id !== 0) {
                    $scope.successProductForm = 'Technician assigned.';
                } else {
                    $scope.successProductForm = 'Technician removed.';
                }
            } else {
                $scope.errorProductForm = 'Some error occured. Please try again.'
            }
            $scope.isProcessing = false;
            $scope.getQuotesDetails()
            ngDialog.closeAll();
            setTimeout(function(){
                $scope.errorProductForm = '';
                $scope.successProductForm = '';
            }, 2000)
        },function(error) {
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            $scope.getQuotesDetails()
            ngDialog.closeAll();
            setTimeout(function(){
                $scope.errorProductForm = '';
                $scope.successProductForm = '';
            }, 2000)
        });
    }
    /* zzzzz Assign Technician*/
    $scope.emailInvoice = function(model){
        $scope.isProcessing = true;
        apiGateWay.send("/send_quotes_email", {quoteId:$scope.quotesId, email:model.email}).then(function(response) {
            if (response.data.status == 200) {
                $scope.getQuotesDetails()
                $scope.successMsg = response.data.message;
                ngDialog.closeAll();
            } else {
                $scope.isProcessing = false;
                $scope.sentEmailError = response.data.message;
            }
            setTimeout(function() {
                $scope.sentEmailError = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        },function(error){
            $scope.isProcessing = false;
            $scope.sentEmailError = error;
            setTimeout(function() {
                $scope.sentEmailError = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 3000);
            //$scope.error = response.data.message;
        });

    }
     //Check PaymentType
     $scope.checkPaymentType = function(model){

        model.transaction_amount =  model.transaction_amount.toString();
        model.transaction_amount = model.transaction_amount.replace(/\$|,/g, ''); //masking reverse

        if(!model.paymentMethod || !model.transaction_amount || model.transaction_amount > $scope.quotesDetails.balanceDue){
            let error = [];
            if(!model.paymentMethod) error.push('Please select payment method')
            if(!model.transaction_amount) error.push('Please enter amount')
            if(model.transaction_amount > $scope.quotesDetails.balanceDue) error.push('Entered amount should not greater than quotes total amount')


            $scope.paymentError = {error};

            setTimeout(function() {
                $scope.paymentError = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
            return false;
        }
        if((model.paymentMethod == 'cc' || model.paymentMethod == 'ach') && !$scope.modeEdit){
        } else {
            
        }
    }
    //get Paya Setting
    $rootScope.getPayaSettings = function(){
        $scope.settingDataAvailable = false;
        apiGateWay.get("/company_paya_details").then(function(response) {
        if (response.data.status == 200) {
            if(response.data.data){
                $scope.payaData = response.data.data;
                $scope.payaStatus = $scope.payaData.status;
            }
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.isProcessing = false;
        })
    }
    $scope.jobArray = [];
    $scope.jobArrayGroup = [];
    $scope.uniqueDate = function(job){
        if(job.groupId) {
            jobDate = $filter('mysqlTojsDate')(job.jobDate)
            jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
            $scope.jobArrayGroup.push({jobDate, groupId: job.groupId})
            //$scope.jobArrayGroup = _.uniqBy($scope.jobArrayGroup, 'jobDate');
            $scope.jobArrayGroup = _.uniqBy($scope.jobArrayGroup, 'groupId');
            $scope.jobArrayGroup = _.sortBy($scope.jobArrayGroup, 'jobDate');
            $scope.jobArray = $scope.jobArrayGroup.map(o => {return o.jobDate});
        } else {
            jobDate = $filter('mysqlTojsDate')(job.jobDate)
            jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
            $scope.jobArray.push(jobDate);
            $scope.jobArray = _.uniqBy($scope.jobArray);
            $scope.jobArray = _.sortBy($scope.jobArray);
        }
    }

    $rootScope.getPayaSettingsNonAuth = function(){
        apiGateWay.get("/company_paya_details_noauth", {companyId:$scope.companyId}).then(function(response) {
        if (response.data.status == 200) {
            if(response.data.data){
                $scope.payaData = response.data.data;
                $scope.payaStatus = $scope.payaData.status;
            }
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.isProcessing = false;
        })
    }
    //Generate PDF
    $scope.generatePdf = function(){
        $scope.isProcessing = true;
        //public_invoice_pdf?companyId=122&invoiceId=25
        $scope.isProcessing = true;
        let apiURL = '/quotes_pdf';
        if($scope.isNoAuthPage){
            apiURL = '/public_quotes_pdf';
        }
        apiGateWay.get(apiURL, {id:$scope.quotesId, companyId:$scope.companyId}).then(function(response) {
            if (response.data.status == 200 && response.data.data.pdf) {

                $window.location.href = response.data.data.pdf;

            } else {
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error){
            $scope.isProcessing = false;
            $scope.error = error;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 3000);
            //$scope.error = response.data.message;
        });
    }
    //Get Payment Profile
    $scope.getPaymentProfile = function(){
        if($scope.isNoAuthPage){
            $scope.showPaymentProfilePopup();
            return false;
        }
        $scope.isProcessing = true;
        apiGateWay.get("/payment_profile",  {customerId: $scope.quotesDetails.customerId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.paymentProfiles = response.data.data;

            } else {
                $scope.paymentProfiles = [];
                $scope.errorMsg = response.data.message;
            }
            $scope.isProcessing = false;
            $scope.showPaymentProfilePopup();
        }, function(error){
            $scope.isProcessing = false;
            $scope.paymentProfiles = [];
            $scope.showPaymentProfilePopup();
        })
    }
    //Show Payment Profile Popup
    $scope.showPaymentProfilePopup = function(){
        $scope.model.transaction_amount = $scope.quotesDetails.balanceDue
        ngDialog.open({
            template: 'selectPaymentMethodPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.model = {
                    paymentMethod : '',
                    notes: '',
                    transaction_amount:''
                }
                $scope.paymentSuccess = false;
                $scope.paymentError = false;
                $scope.selectedPaymentMethod = '';
            }
          });
    }

    //Show Email quotes Popup
    $scope.showEmailQuotesPopup = function(){

//        $scope.sentEmailModel.email = $scope.quotesDetails.length > 0 && quotesDetails.billingDetails ? $scope.quotesDetails.billingDetails.email : $scope.customerDetails.customer.email;
          $scope.sentEmailModel.email = $scope.quotesDetails.length > 0 && quotesDetails.billingDetails ? $scope.quotesDetails.billingDetails.email : $scope.quotesDetails.billingDetails.email;

        $scope.successMsg = false;
        $scope.sentEmailError = false;
        ngDialog.open({
            template: 'sentEmailPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {


            }
          });
    }

    $scope.payaErrorMessage = '';
    
    //Save Notes
    $scope.isNotesUpdating = {
        quotesNotes: false,
        officeNotes: false,
        techNotes: false
    };    
    $scope.notesSuccessMsg = '';
    $scope.notesErrorMsg = '';
    $scope.saveNotes = function(notes, noteType='quoteNotes'){
        let _notes = notes;        
        if((noteType == 'quoteNotes' && _notes == $scope.quotesDetails.notes) || 
           (noteType == 'quoteOfficeNotes' && _notes == $scope.quotesDetails.officeNotes) || 
           (noteType == 'quoteTechNotes' && _notes == $scope.quotesDetails.techNotes)) {
            return false;
        }
        if (noteType == 'quoteNotes') { 
            _notes = $scope.quotesModel.quotesNotes;
            $scope.isNotesUpdating.quotesNotes = true;
        }
        if (noteType == 'quoteOfficeNotes') { 
            _notes = $scope.quotesModel.officeNotes;
            $scope.isNotesUpdating.officeNotes = true;
        }
        if (noteType == 'quoteTechNotes') { 
            _notes = $scope.quotesModel.techNotes;
            $scope.isNotesUpdating.techNotes = true;
        }
        $scope.notesSuccessMsg = '';
        $scope.notesErrorMsg = '';
        apiGateWay.send("/update_quotes_notes", {quotesId:$scope.quotesId, notes: _notes, type: noteType}).then(function(response) {
            if (response.data.status == 200){
                if (noteType == 'quoteNotes') { 
                    $scope.quotesDetails.notes = notes;                    
                }
                if (noteType == 'quoteOfficeNotes') { 
                    $scope.quotesDetails.officeNotes = notes;
                }
                if (noteType == 'quoteTechNotes') { 
                    $scope.quotesDetails.techNotes = notes;
                }                
                let noteTypeStr = '';
                if (noteType == 'quoteNotes') { noteTypeStr = 'Quote'}
                if (noteType == 'quoteOfficeNotes') { noteTypeStr = 'Office' }
                if (noteType == 'quoteTechNotes') { noteTypeStr = 'Tech' } 
                $scope.notesSuccessMsg = noteTypeStr + ' notes updated successfully';
                $timeout(function(){
                    $scope.notesSuccessMsg = ''
                }, 2000)
            } else {
                $scope.notesErrorMsg = response.data.message;
                $timeout(function(){
                    $scope.notesErrorMsg = ''
                }, 2000)
            }
            $scope.isNotesUpdating.quotesNotes = false;
            $scope.isNotesUpdating.officeNotes = false;
            $scope.isNotesUpdating.techNotes = false;
        }, function(error){
            $scope.isNotesUpdating.quotesNotes = false;
            $scope.isNotesUpdating.officeNotes = false;
            $scope.isNotesUpdating.techNotes = false;
            $scope.notesErrorMsg = typeof error == 'string' ? error : 'Something went wrong. Please try again.';
            $timeout(function(){
                $scope.notesErrorMsg = ''
            }, 2000)
        })
    }
    $scope.saveQuotesTitle = function(title){
        $scope.titleHasError = false;
        if(title == $scope.quotesDetails.title){
            return false;
        }
        $scope.isProcessing = true;
        apiGateWay.send("/update_quotes_title", {quotesId:$scope.quotesId, title:$scope.quotesModel.quotesTitle}).then(function(response) {
            if (response.data.status == 200){
                $scope.quotesDetails.title = title;
            } else {
                $scope.errorMsg = response.data.message;
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
        })
    }

    $scope.chemicalReadingArray = function(items){

        let result = {}
        let total = 0;
        angular.forEach(items, function(job){

            angular.forEach(job.chemicalDetails, function(item){

                if(result[item.chemical]){
                    result[item.chemical].qty = result[item.chemical].qty+parseFloat(item.qty);
                   // result[item.chemical].rate = result[item.chemical].rate+parseFloat(item.rate);
                    result[item.chemical].rate = result[item.chemical].rate;
                    result[item.chemical].total = result[item.chemical].total+parseFloat(item.total);
                } else {
                    result[item.chemical] = angular.copy(item);
                    //result[item.chemical].grandTotal = job.chemicalCost;
                }

            })
            total = total + parseFloat(job.chemicalCost);
        })

        return {rows: Object.keys(result).map(function(k) {return result[k]}), total:total};

    }

    $scope.getCompanySetting = function(){
        $scope.isProcessing = true;
        apiGateWay.get("/company_billing_settings?"+$scope.companyId).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerTaxData.taxSettingArray = response.data.data.taxData;
            }
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });

    }

    $scope.taxSelected = function(id, getQuotesDetails= true){

        $scope.isProcessing = true;
        $scope.customerTaxData.selectedTaxId = id;
        angular.forEach($scope.customerTaxData.taxSettingArray, function(item){
            if(item.id == id){
                $scope.customerTaxData.selectedTaxTitle = item.title + " (" + item.amount + "%)";
                $scope.customerTaxData.selectedTaxAmount = item.amount;
            }
        });
        $scope.customerTaxData.selectedTaxValue = ($scope.quotesDetails.subTotalAmount - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;

        apiGateWay.send("/update_quotes_tax", {quotesId:$scope.quotesId, taxTitle:$scope.customerTaxData.selectedTaxTitle, taxPercentValue:$scope.customerTaxData.selectedTaxAmount, isRemove:0}).then(function(response) {
            if (response.status == 200 && response.data.data) {
                $scope.isProcessing = false;

                $scope.quotesDetails.balanceDue = response.data.data.balanceDue;

                if($scope.customerDiscountData.discountAmount>0){
                    $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount + $scope.customerTaxData.selectedTaxValue - $scope.customerDiscountData.discountAmount;
                }else{
                    $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount + $scope.customerTaxData.selectedTaxValue;
                }
                if(getQuotesDetails){
                 $scope.getQuotesDetails();
                }

            } else {
                $scope.isProcessing = false;

            }
        },function(error){
            $scope.isProcessing = false;
        });

        $scope.customerTaxData.taxDataPopup = false;
    }
    $scope.removeTax = function(){
        $scope.isProcessing = true;
        apiGateWay.send("/update_quotes_tax", {quotesId:$scope.quotesId, taxTitle:"", taxPercentValue:0, isRemove:1}).then(function(response) {
            if (response.data.status == 200 && response.data.data) {
                $scope.quotesDetails.balanceDue = response.data.data.balanceDue;
                $scope.isProcessing = false;
                $scope.customerTaxData.selectedTaxTitle = "";
                $scope.customerTaxData.selectedTaxAmount = 0;
                $scope.customerTaxData.selectedTaxValue = 0;
                $scope.getQuotesDetails();
               if($scope.customerDiscountData.discountAmount>0){
                    $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount - $scope.customerDiscountData.discountAmount;
                }else{
                    $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount;
                }
            } else {
                $scope.isProcessing = false;
                $scope.customerTaxData.errorMsg = error;
            }

        },function(error){
            $scope.isProcessing = false;
            $scope.customerTaxData.errorMsg = error;
        });
        setTimeout(function () {
            $scope.customerTaxData.errorMsg = '';
        }, 2000);
    }

    $scope.showTaxPopup = function(){

        $scope.customerTaxData.taxDataPopup = !$scope.customerTaxData.taxDataPopup;

        if ($scope.customerTaxData.taxDataPopup) {

            $scope.$window.onclick = function (event) {
                closeTaxPopup(event);
            };
        } else {
            $scope.customerTaxData.taxDataPopup = false;
           // $scope.$window.onclick = null;
        }
    }

    function closeTaxPopup(event) {

        var clickedElement = event.target;
        if (!clickedElement) return;

        var elementClasses = clickedElement.classList;
        var clickedOnDiscountPop = elementClasses.contains('tax-button') || elementClasses.contains('tax-button') || (clickedElement.parentElement !== null && clickedElement.parentElement.classList.contains('tax-button'));
        if (!clickedOnDiscountPop) {
            $scope.customerTaxData.taxDataPopup = false;
            return;
        }
    }

    $scope.showDiscountInput= function(){
        $scope.customerDiscountData.discountDataShow = !$scope.customerDiscountData.discountDataShow;
        $scope.customerDiscountData.discountValue = 0;
    }
    $scope.updateDiscountType= function($index){
        $scope.customerDiscountData.dtype  = $index ;
        $scope.discountValueChange();
    }
    $scope.discountValueChange= function(){
       if($scope.customerDiscountData.dtype=='%'){
        $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue * $scope.quotesDetails.subTotalAmount/100  ;
        $scope.customerDiscountData.discountTitle = $scope.customerDiscountData.discountValue+" "+$scope.customerDiscountData.dtype;
       } else{
        $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        $scope.customerDiscountData.discountTitle = $scope.customerDiscountData.dtype + $scope.customerDiscountData.discountValue;
       }

    }
    $scope.saveDiscountByInput = function(e){
        if (e.keyCode == 13) {
            $scope.saveDiscount();
        }
    }
    $scope.saveDiscount = function(getQuotesDetails= true){
        if($scope.customerDiscountData.discountAmount > $scope.quotesDetails.subTotalAmount){
            $scope.errorDiscount ="Discount amount should not be more than the subtotal";

            setTimeout(function () {
                $scope.errorDiscount = '';
            }, 2000);
            return false;
        }

        if( $scope.customerDiscountData.discountAmount > 0){
            $scope.isProcessing = true;

            /*if($scope.customerDiscountData.discountAmount > $scope.quotesDetails.balanceDue){

                $scope.customerDiscountData.discountAmount = $scope.quotesDetails.balanceDue;

            }*/

            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = ($scope.quotesDetails.subTotalAmount - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount - $scope.customerDiscountData.discountAmount;
            }
           // $scope.customerDiscountData.discountAmount = $scope.customerDiscountData.discountAmount > $scope.quotesDetails.balanceDue ? $scope.quotesDetails.balanceDue : $scope.customerDiscountData.discountAmount;
           $scope.discountUpdating = true;
            apiGateWay.send("/update_quotes_discount", {quotesId: $scope.quotesId, discountTitle:$scope.customerDiscountData.discountTitle, discountValue: $rootScope.currencyTrimmer($scope.customerDiscountData.discountAmount), taxValue:$scope.customerTaxData.selectedTaxValue, isRemove:0}).then(function(response) {
                if (response.data.status == 200){
                    $scope.customerDiscountData.discountDataUpdated = true;
                    $scope.customerDiscountData.discountDataShow = false;
                    $scope.quotesDetails.balanceDue = response.data.data.balanceDue;                    
                    if(getQuotesDetails){                        
                        $scope.getQuotesDetails();
                    }
                } else {                    
                    $scope.errorBottom = response.data.message;
                    $scope.scrollToError('#bottom-section-error')
                    setTimeout(function() {
                        $scope.errorBottom = '';
                        if (!$scope.$$phase) $scope.$apply()
                    }, 3000);
                }
                $scope.isProcessing = false;                
            }, function(error){
                $scope.errorBottom = error;
                $scope.scrollToError('#bottom-section-error')
                setTimeout(function() {
                    $scope.errorBottom = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 3000);
                $scope.isProcessing = false;
                if(getQuotesDetails){
                    $scope.getQuotesDetails();
                }
            })
        }
    }
    $scope.scrollToError = function(id){
        $('html, body').animate({
            scrollTop: $(id).offset().top
        }, 200);
    }

    $scope.removeDiscount = function(){
        $scope.isProcessing = true;
        $scope.discountUpdating = true;
        if($scope.customerTaxData.selectedTaxValue>0){
            $scope.customerTaxData.selectedTaxValue = $scope.quotesDetails.subTotalAmount * $scope.customerTaxData.selectedTaxAmount / 100;
            $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount + $scope.customerTaxData.selectedTaxValue;
        }else{
            $scope.quotesDetails.totalAmount = $scope.quotesDetails.subTotalAmount;
        }

        apiGateWay.send("/update_quotes_discount", {quotesId: $scope.quotesId, discountTitle:"", discountValue:0, taxValue:$scope.customerTaxData.selectedTaxValue, isRemove:1}).then(function(response) {
            if (response.data.status == 200){

                $scope.customerDiscountData.discountTitle = "";
                $scope.customerDiscountData.discountAmount = 0;
                $scope.customerDiscountData.discountDataUpdated = false;
                $scope.customerDiscountData.discountDataShow = false;
                $scope.quotesDetails.balanceDue = response.data.data.balanceDue;

                $scope.getQuotesDetails();

            } else {
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
            $scope.customerDiscountData.errorMsg = error;
        })
        setTimeout(function(){
            $scope.customerDiscountData.errorMsg = '';
          }, 2000)

    }

    $scope.getCustomerDetails = function() {
        $scope.customerDiscountData = {"discountDataShow":true, "discountDataUpdated":false, "discountAmount":0, "discountValue":0, "DiscountTitle":"", "dtype":"%","addDiscountButton":true, "errorMsg":""};
        $scope.customerTaxData = {"taxSettingArray":[],"taxDataPopup":false, "selectedTaxId":null, "selectedTaxAmount":0, "addTaxButton":true};
        $scope.getQuotesDetails();
        $scope.isProcessing = true;
        let addressId= $scope.addressId;
        apiGateWay.get("/customer_short_details", {"addressId":addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerDetails = response.data.data;
            }
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });
    };

    $scope.addBundleProductSearch = () => {
        $scope.bundleSearchText = "";
        if($scope.existPaymentValue) {
            ngDialog.open({
                template: 'existPaymentValue.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {

                }
              });
        } else {
            $scope.saveOneTimeJob = true;
            $scope.bundleSearchForm = true;
            setTimeout(function(){
                angular.element("#bundleSearchText").focus();
            }, 100);
        }

    }
    $scope.saveInvoiceType = function(invoiceType) {
        $scope.invoiceType = invoiceType;
    }
    
    $scope.addProductToBundle = (productBundleListCategory) => {
        // assign id to photos
        if (productBundleListCategory.bundleItemReference && productBundleListCategory.bundleItemReference.length > 0) { // if bundle 
            productBundleListCategory.photos = [];
            productBundleListCategory.bundleItemReference.forEach(function(bundleItem){
                if (bundleItem.photos && bundleItem.photos.length > 0) {
                    bundleItem.photos.forEach(function(photo){
                        photo.productId = bundleItem.id;
                        productBundleListCategory.photos.push(photo)
                    })
                }
            })
        }
        if (productBundleListCategory.photos && productBundleListCategory.photos.length > 0) {
            $scope.isProcessing = true;
            $scope.showAddProduct = false;
            var items = [];
            productBundleListCategory.photos.forEach(function(file, index){
                var oldPrefix  = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathProducts + $rootScope.userSession.companyId+'/' + (file.productId ? file.productId : productBundleListCategory.id) + '/';
                var newPrefix =  $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuotes + $rootScope.userSession.companyId+'/' +$scope.quotesId + '/';
                let copySource = file.fileName;
                let newName = file.fileName.replace(oldPrefix, newPrefix)               
                let key = $rootScope.renameOriginalFile(newName, index);
                file.updatedName = key;                
                items.push({
                    sourceKey: copySource,
                    destinationKey: key
                }) 
            })            
            if (items.length > 0) {
                AwsS3Utility.copyFiles(items)
                .then(function(data) {
                    productBundleListCategory.photos.forEach(function(file){
                        file.fileName = file.updatedName;
                        delete file.updatedName;
                        if (file.productId) {
                            delete file.productId
                        }                        
                    })           
                    $scope.addProductToBundleInner(productBundleListCategory)
                })
                .catch(function(error) {
                    // 
                    $scope.isProcessing = false;
                })
            }            
        } else {
            $scope.addProductToBundleInner(productBundleListCategory)
        }      
    }
    $scope.addProductToBundleInner = function(productBundleListCategory) {
        $scope.showAddProduct = false;
        if(!productBundleListCategory.bundleItemReference && productBundleListCategory.category === 'Bundle') {
            productBundleListCategory.bundleItemReference = [];
        }
        if(productBundleListCategory.bundleItemReference && productBundleListCategory.bundleItemReference.length > 0) {
            angular.forEach(productBundleListCategory.bundleItemReference, (element, index) => {
                // element.photos = [];
                if ((element.isChargeTax === undefined || element.isChargeTax === null)) {
                    if (element.category == "Product") {
                        if ($scope.defaultTaxSettingData.companyProductTaxe == 1) {
                            element.isChargeTax = 1
                        } else {
                            element.isChargeTax = 0
                        }
                    }
                    if (element.category == "Service") {
                        if ($scope.defaultTaxSettingData.companyServiceTaxe == 1) {
                            element.isChargeTax = 1
                        } else {
                            element.isChargeTax = 0
                        }
                    }
                }
            });
        }
        if($scope.productNoItem == true){
            let bundleObj = [{
                "category":productBundleListCategory.category,
                "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null,
                "cost": productBundleListCategory.cost,
                "id": productBundleListCategory.id,
                "name": productBundleListCategory.name,
                "price": productBundleListCategory.price,
                "sku": productBundleListCategory.sku,
                "showIndividualPrice": productBundleListCategory.showIndividualPrice,
                "isChargeTax": productBundleListCategory.isChargeTax,
                "islabels": "N",
                "islabelsText": "",
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "description": productBundleListCategory.description ? productBundleListCategory.description : '',
                "duration":  productBundleListCategory.duration ? productBundleListCategory.duration : '00:00:00',
                "photos": productBundleListCategory.photos
            }];
            $scope.productBundleListNew = bundleObj;
            $scope.productBundleListNewCategory = bundleObj.category;
            $scope.productNoItem = false;
        } else {
            let bundleObj = {
                "category":productBundleListCategory.category,
                "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null,
                "cost": productBundleListCategory.cost,
                "id": productBundleListCategory.id,
                "name": productBundleListCategory.name,
                "price": productBundleListCategory.price,
                "sku": productBundleListCategory.sku?productBundleListCategory.sku:'',
                "showIndividualPrice": productBundleListCategory.showIndividualPrice,
                "isChargeTax": productBundleListCategory.isChargeTax,
                "islabels": "N",
                "islabelsText": "",
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "description": productBundleListCategory.description ? productBundleListCategory.description : '',
                "duration":  productBundleListCategory.duration ? productBundleListCategory.duration : '00:00:00',
                "photos": productBundleListCategory.photos
            };
            $scope.productBundleListNew.push(bundleObj);
            $scope.productBundleList = angular.copy($scope.productBundleListNew);
        }
        $scope.isBundleSearch = false;
        $scope.bundleSearchForm = false;
        $scope.bundleCost = productBundleListCategory.cost;
        $scope.calculateBundleCost();

        $scope.saveInvoiceItem();

    }

    $scope.saveInvoiceItem = function() {
        $scope.isProcessing = true;
        let subTotalAmt  = parseFloat($scope.quotesDetails.subTotalAmount) + parseFloat($scope.bundleSubTotal)
        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        }
        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }else{
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - 0) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt
            }
        }

        $scope.quotesDetails.balanceDue = $scope.quotesDetails.totalAmount
        let saveInvoiceProductItem = {
            "itemReference":$scope.productBundleListNew,
            "quotesId":$scope.quotesId,
            "action":"Add",
            "customerId":$scope.quotesDetails.customerId,
            "addressId":$scope.quotesDetails.serviceAddressId,
            "quotesStatus":$scope.quotesDetails.quotesStatus,
            "subTotalAmount": $scope.quotesDetails.subTotalAmount,
            "totalAmount": $scope.quotesDetails.totalAmount,
            "companyId":auth.getSession().companyId,
            "discountValue": $rootScope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.quotesDetails.balanceDue,
            "photos": []
        };
        // show error if amount is less then zero
        if (saveInvoiceProductItem.subTotalAmount && saveInvoiceProductItem.subTotalAmount < 0) {
            $scope.isProcessing = false;
            $scope.errorProductForm = "The total amount can't be less than $0.00";
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            return
        }
        saveInvoiceProductItem = $scope.updatePriceData(saveInvoiceProductItem);
        apiGateWay.send("/edit_quotes", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductForm = response.data.message;
                setTimeout(function() {
                    $scope.successProductForm = "";
                }, 2000);
                $scope.getQuotesDetails();
                $scope.isProcessing = false;
                $scope.productBundleListNew = [];
            } else {
                $scope.errorProductForm = 'Error';
                setTimeout(function() {
                    $scope.errorProductForm = "";
                }, 2000);
                $scope.isProcessing = false;
            }
        },function(error) {
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
        $scope.showAddProduct = true
    }

    $scope.calculateBundleCost = () => {
        $scope.bundleSubTotal = 0;
        if( $scope.productBundleListNew.length > 0){
            angular.forEach( $scope.productBundleListNew, function(value, key) {
                $scope.bundleSubTotal = $scope.bundleSubTotal + (value.price)*(value.qty);
                $scope.bundleTotal = ($scope.bundleSubTotal)+($scope.discountCalculation);
            })

        }
    }

    $scope.cancelInvoiceItem = () => {
        $scope.productBundleListNew = [];
        $scope.showAddProduct = true
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

    $scope.calculateBundleCostAndSave = (productBundleListCategory, k, j) => {
        $scope.bundleSubTotal = 0;
        let subTotalAmountVar = 0;
        let totalAmountVar = 0;

        productBundleListCategory.unitPrice =  productBundleListCategory.unitPrice.toString(); // reverse masking
        productBundleListCategory.unitPrice = productBundleListCategory.unitPrice.replace(/\$|,/g, ''); // reverse masking
        if(!productBundleListCategory.qty || productBundleListCategory.qty==0){
            $scope.errorProductFormQty[k] = 'Quantity cannot be zero.';
            setTimeout(function() {
                $scope.errorProductFormQty[k] = "";
            }, 2000);
            return false;
        }
        $scope.isProcessing = true;

        pAmmount = parseFloat(productBundleListCategory.qty) * parseFloat(productBundleListCategory.unitPrice).toFixed(2);
        pAmmount = pAmmount.toFixed(2);
        productBundleListCategory.amount = parseFloat(productBundleListCategory.amount);
        if(pAmmount > parseFloat(productBundleListCategory.amount.toFixed(2))){
            diffammount = pAmmount - parseFloat(productBundleListCategory.amount.toFixed(2))
            diffammount = diffammount.toFixed(2)
            subTotalAmountVar = parseFloat($scope.quotesDetails.subTotalAmount.toFixed(2)) + parseFloat(diffammount)

            totalAmountVar = parseFloat($scope.quotesDetails.totalAmount.toFixed(2)) + parseFloat(diffammount)
        }

        if(pAmmount < parseFloat(productBundleListCategory.amount)){
            diffammount =  parseFloat(productBundleListCategory.amount) - pAmmount
            subTotalAmountVar = parseFloat($scope.quotesDetails.subTotalAmount) - parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.quotesDetails.totalAmount) - parseFloat(diffammount)
        }
        
        // show error if amount is less then zero
        if (subTotalAmountVar < 0) {
            $scope.errorProductForm = "The quote total can't be less than $0.00";
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            $scope.isProcessing = false;
            return
        }

        if(pAmmount == parseFloat(productBundleListCategory.amount)){
            $scope.isProcessing = false;

            subTotalAmountVar = parseFloat($scope.quotesDetails.subTotalAmount)
            totalAmountVar = parseFloat($scope.quotesDetails.totalAmount)
        }

        productBundleListCategory.amount = parseFloat(pAmmount)
        productBundleListCategory.unitPrice = parseFloat(productBundleListCategory.unitPrice)

        let subTotalAmt  = parseFloat(subTotalAmountVar)
        if($scope.quotesDetails.totalAmount == 0){
            $scope.quotesDetails.totalAmount = subTotalAmt
        }else{
            $scope.quotesDetails.totalAmount = totalAmountVar
        }

        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * (subTotalAmt)/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.quotesDetails.discountValue;
        }

        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != "" &&
        Number.isNaN($scope.customerDiscountData.discountAmount)=== true && parseFloat($scope.quotesDetails.discountValue) > 0 ){
            $scope.customerDiscountData.discountAmount  = $scope.quotesDetails.discountValue;
        }

        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }else{
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - 0) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt
            }
        }

        if($scope.customerDiscountData.discountAmount > subTotalAmt){
            $scope.isProcessing = false;
            $scope.IsTextFieldVisible[k] =  false ;
            $scope.IsBunddleVisible[k] =  false ;
            $scope.errorProductForm = "Discount amount should not be more than the subtotal";
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            return false;
        }

        $scope.quotesDetails.balanceDue = $scope.quotesDetails.totalAmount

        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "quotesId":$scope.quotesId,
            "action":"Edit",
            "customerId":$scope.quotesDetails.customerId,
            "addressId":$scope.quotesDetails.serviceAddressId,
            "quotesStatus":$scope.quotesDetails.quotesStatus,
            "subTotalAmount": $scope.quotesDetails.subTotalAmount,
            "totalAmount": $scope.quotesDetails.totalAmount,
            "companyId":auth.getSession().companyId,
            "discountValue": $rootScope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.quotesDetails.balanceDue,
            "isCommission": $scope.isCommission
        };
        saveInvoiceProductItem = $scope.updatePriceData(saveInvoiceProductItem);
        apiGateWay.send("/edit_quotes", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductForm = response.data.message;
                $scope.isCommission='True';
                setTimeout(function() {
                    $scope.successProductForm = "";
                }, 2000);
                //$scope.isProcessing = false;
                $scope.productBundleListNew = [];
                $scope.getQuotesDetails();
                //$scope.quotesDetails.subTotalAmount = subTotalAmountVar;
                // if($scope.customerDiscountData.discountDataUpdated && $scope.customerDiscountData.discountTitle !=''){
                //     $scope.getQuotesDetails(true);
                // } else {
                //     $scope.getQuotesDetails(false);
                // }
                //$scope.getQuotesDetails(true);
                // $scope.discountValueChange();
                // $scope.saveDiscount();
                // $scope.taxSelected($scope.customerTaxData.selectedTaxId);

                $scope.IsTextFieldVisible[k] =  false ;
                $scope.IsBunddleVisible[k] =  false ;
            } else {
                $scope.quoteImageProcessing = false;
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
                $scope.IsTextFieldVisible[k] =  false ;
                $scope.IsBunddleVisible[k] =  false ;
            }
        },function(error) {
            $scope.quoteImageProcessing = false;
            $scope.isProcessing = false;
            $scope.IsTextFieldVisible[k] =  false ;
            $scope.IsBunddleVisible[k] =  false ;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });


    }

    $scope.deleteLineDataAndSave = (productBundleListCategory, k) => {
        let total = (typeof $scope.quotesDetails.subTotalAmount === "number") ? $scope.quotesDetails.subTotalAmount : parseFloat($scope.quotesDetails.subTotalAmount.replace(/[^0-9.-]/g, ''));
        let itemTotal = (typeof productBundleListCategory.price === "number") ? productBundleListCategory.price : parseFloat(productBundleListCategory.price.replace(/[^0-9.-]/g, ''));
        itemTotal = itemTotal < 0 ? Math.abs(itemTotal) : itemTotal;
        if ((total - itemTotal) < 0) {
              $scope.errorProductForm = "The job template total can't be less than $0.00";
              setTimeout(function () {
                $scope.errorProductForm = "";
              }, 2000);
              return false;
        }
        $scope.bundleSubTotal = 0;
        $scope.isProcessing = true;
        let subTotalAmt  = parseFloat($scope.quotesDetails.subTotalAmount) - parseFloat(productBundleListCategory.amount)
        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        }

        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != "" &&
        Number.isNaN($scope.customerDiscountData.discountAmount)=== true && parseFloat($scope.quotesDetails.discountValue) > 0 ){
            $scope.customerDiscountData.discountAmount  = $scope.quotesDetails.discountValue;
        }

        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }else{
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - 0) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt
            }
        }

        $scope.quotesDetails.balanceDue = $scope.quotesDetails.totalAmount

        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "quotesId":$scope.quotesId,
            "action":"Delete",
            "customerId":$scope.quotesDetails.customerId,
            "addressId":$scope.quotesDetails.serviceAddressId,
            "quotesStatus":$scope.quotesDetails.quotesStatus,
            "subTotalAmount": $scope.productBundleListNew.length > 0 ? $scope.quotesDetails.subTotalAmount : 0,
            "totalAmount": $scope.quotesDetails.totalAmount,
            "companyId":auth.getSession().companyId,
            "discountValue": $rootScope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.quotesDetails.balanceDue
        };
        $scope.customerDiscountData.discountDataUpdated = $scope.productBundleListNew.length > 0 ? $scope.customerDiscountData.discountDataUpdated : 0;
        saveInvoiceProductItem = $scope.updatePriceData(saveInvoiceProductItem);
        let photos = [];
        if (saveInvoiceProductItem && saveInvoiceProductItem.itemReference && saveInvoiceProductItem.itemReference.photos) {
            if (saveInvoiceProductItem.itemReference.photos.length > 0) {    
                saveInvoiceProductItem.itemReference.photos.forEach(function(file){                           
                    photos.push($scope.quoteImageAwsPath + file.fileName)
                })     
            }
        }                           
        apiGateWay.send("/edit_quotes", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                if (photos.length > 0) {
                    AwsS3Utility.deleteFiles(photos)
                    .then(function(data) {
                        // delete
                    })
                    .catch(function(error) {
                        // 
                    })
                }
                $scope.successProductForm = response.data.message;
                setTimeout(function() {
                    $scope.successProductForm = "";
                }, 2000);
                $scope.isProcessing = false;
                $scope.productBundleListNew = [];
                $scope.IsTextFieldVisible = [];
                $scope.getQuotesDetails();

            } else {
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
                $scope.IsTextFieldVisible[k] = $scope.IsTextFieldVisible[k] ? false : true;
            }
        },function(error) {
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            $scope.IsTextFieldVisible[k] = $scope.IsTextFieldVisible[k] ? false : true;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });


    }

    $rootScope.deleteQuotesConfirm = function(){
        $scope.addInvoicePopup = ngDialog.open({
            id  : 11,
            template: 'deleteQuotesConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {

            }
        });
    }
    $scope.deleteQuoteImages = function(data) {
        let itemsForDelete = []
        if (data && data.length > 0) {
            data.forEach(function(item){
                if (item.photos && item.photos.length > 0) {
                    item.photos.forEach(function(photo){
                        if (photo.isOldMethod) {
                            itemsForDelete.push((($rootScope.isTestServer || $rootScope.isLocalServer) ? $scope.env.awsAssetsPrefix : '') + $scope.quotesId + '/' + photo.fileName)
                        } else {
                            itemsForDelete.push(photo.fileName)                            
                        }
                    })
                }
            })
        }
        if (itemsForDelete && itemsForDelete.length > 0) {
            AwsS3Utility.deleteFiles(itemsForDelete)
            .then(function(data) {
                // delete
            })
            .catch(function(error) {
                // 
            })      
        }           
    }
    $rootScope.deleteQuote = function(){       
        $scope.isProcessing = true;
        apiGateWay.send("/delete_quote", {
            "id": $scope.quotesId
        }).then(function(response) {
            if (response.status == 200) {
                $scope.isProcessing = false;
                $scope.deleteQuoteImages($scope.quotesDetails.details[0].lineData)
            }
            $scope.successMsg = response.data.message;
            $scope.addInvoicePopup.close();

            setTimeout(function() {
                $scope.successMsg = false;

                $state.go("app.customerdetail", {
                    addressId: $scope.quotesDetails.billingDetails.addressId
                });
            }, 2000)
        }, function(error){
            $scope.isProcessing = false;
            $scope.addInvoicePopup.close();
            if(error.message!=""){$scope.error = error;}else{$scope.error = 'Something went wrong';}
            setTimeout(function() {
                $scope.error = "";
            }, 2000);
        })
    };
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
        $scope.searchText = "";
        $scope.bundleSearchText = "";
    }
    $scope.showIndPrice = function(obj,k){
        $scope.isProcessing = true;
        obj.showIndividualPrice = 1
        $scope.calculateBundleCostAndSaveLableToggle(obj,k)
    }
    $scope.hideIndPrice = function(obj,k){
        $scope.isProcessing = true;
        obj.showIndividualPrice = 0
        $scope.calculateBundleCostAndSaveLableToggle(obj,k)
    }
    $scope.ShowHide = function (e) {
        e.currentTarget.text = (e.currentTarget.text=="show") ? "hide" : "show";
        $scope.IsVisible = $scope.IsVisible ? false : true;
    }
    $scope.ShowHideTextField = function (k) {
        $scope.IsTextFieldVisible[k] = $scope.IsTextFieldVisible[k] ? false : true;
        $scope.IsTextFieldVisible[k] ? false : $scope.getQuotesDetails();
        $scope.IsTextFieldVisible[k] ? $scope.bundleSearchForm = false : true;
        $scope.IsBunddleVisible = []
    }

    $scope.addLableOption = function (k) {
        $scope.IsLableFieldVisible[k] = $scope.IsLableFieldVisible[k] ? false : true;
        $scope.IsLableFieldVisible[k] ? false : $scope.getQuotesDetails();
    }
    $scope.lableChange = function (obj,k,value) {
        $scope.isProcessing = true;
        obj.islabels = "Y"
        obj.islabelsText = value;
        $scope.calculateBundleCostAndSaveLableToggle(obj,k)
    }
    $scope.lableDelete = function (obj,k) {
        $scope.isProcessing = true;
        obj.islabels = "N"
        obj.islabelsText = ""
        $scope.calculateBundleCostAndSaveLableToggle(obj,k)
        $scope.IsLableFieldVisible[k]  = false
    }

    $scope.ShowHideBundleItemReference = function (k, j) {
        $scope.IsBunddleVisible = []
        //if(!$scope.IsBunddleVisible[k]){
            $scope.IsBunddleVisible[k] = [];
       // }
        $scope.IsBunddleVisible[k][j] = $scope.IsBunddleVisible[k][j] ? false : true;
        $scope.IsBunddleVisible[k][j] ? false : $scope.getQuotesDetails();
        $scope.IsBunddleVisible[k][j] ? $scope.bundleSearchForm = false : true;
        $scope.IsTextFieldVisible[k] = false
    }
    $scope.sentToJobPage = function(jobId){
        $state.go("app.onetimejob",{"addressId":$scope.quotesDetails.billingDetails.addressId,"jobId":jobId}, {reload: true});        
    }
    $scope.stausChangePopuOpen = false;
    $scope.stausChange = function(i){
        $scope.titleHasError = false;
        // if(i == 'Approved' && ($scope.quotesModel.quotesTitle == '' || $scope.quotesModel.quotesTitle == null)) {
        //     $scope.titleHasError = true;
        //     return;
        // }
        var old = $scope.quotesModel.status;
        if (old === i) {
            return
        }
        $scope.quotesModel.status = i;
        $rootScope.quotesModelStatus = i;
        $scope.quotesModel.statusNote = '';
        // return
        $scope.stausChangePopuOpen = true;
        $scope.addInvoicePopup = ngDialog.open({
            id  : 11,
            template: 'statusChangeQuotesConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.stausChangePopuOpen = false;
                $scope.quotesModel.status = old
                $rootScope.quotesModelStatus = old
                $scope.hasErrorLabel = false;
            }
        });
    }
    $scope.stausNoAuthChange = function(status){
        $scope.quotesModel.status = status;
        $rootScope.quotesModelStatus = status;
        $rootScope.quotesModelStatus = status;
        $scope.selectedStatusForAPI = status;
        $scope.quotesModel.statusNote = '';
        $scope.stausChangePopuOpen = true;
        $scope.addInvoicePopup = ngDialog.open({
            id  : 11,
            template: 'statusChangeQuotesConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.stausChangePopuOpen = false;
                $scope.quotesModel.status = "";
                $rootScope.quotesModelStatus = "";
                $rootScope.quotesModelStatus = "";
                $scope.quotesModel.statusNote = '';
                $scope.isAlertOpened = false;
                $scope.isStatusAPIhitted = false;
                if ($scope.isStatusAPIhitted) {
                    $scope.getQuotesDetails();
                }
            }
        });
    }
    $scope.selectwaterBodyOption = (selectwaterBodyId, selectwaterBody) => {
        $scope.selectwaterBody = selectwaterBody
        $scope.waterBodyListId = selectwaterBodyId;
        $scope.updateWaterBody();
    }
    $scope.hasErrorLabel = false;
    $scope.isAlreadyApproved = ''; 
    $scope.changeQuoteStatus = function(type='auth'){
        $scope.isAlreadyApproved = '';
        if ($scope.quotesDetails.subTotalAmount < 0 && $scope.quotesModel.status == 'Approved') {
            $scope.errorProductForm = "The quote total can't be less than $0.00";
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            return;
        }
        var notes = $scope.quotesModel.statusNote ? $scope.quotesModel.statusNote : '';
        $scope.isProcessing = true;
        authUserId = auth.getSession().id
        authUserType = auth.getSession().userRole;
        if(!authUserType && type ==='auth'){
            authUserType = 'superadmin'
        }
        if (type != 'auth'){
            authUserType = 'customer'
        }
        apiGateWay.send("/change_quotes_status", {quotesId: $scope.quotesId, quotesStatus:$scope.quotesModel.status, quotesStatusNote:notes, updatedStatusUserId: authUserId, userType: authUserType  }).then(function(response) {
            if (response.status == 200){
                if (type === 'auth') {
                    ngDialog.closeAll();
                } else {
                    $scope.isAlertOpened = true;
                }
                if ($scope.quotesModel.status == "Approved") {
                    $scope.isJobDeleted = false;
                }
                $scope.isStatusAPIhitted = true;
                $scope.hasErrorLabel = false;
                $scope.globalQuoteSettings = {
                    isNotesRequired: 0 
                }
                $scope.getQuotesDetails();
            } else {
            }
            $scope.isProcessing = false;
        }, function(error){            
            if (error === 'Please enter required parameters') {                
                $scope.globalQuoteSettings = {
                    isNotesRequired: 1 
                }
                $scope.hasErrorLabel = true;
                var input = document.getElementById('statusNote');
                if (input) {
                    input.focus()
                }
                $scope.isProcessing = false;
            }
            if (error === 'This Quotes is already Approved.') {                
                $scope.isAlreadyApproved = 'This quote is already approved.';                    
                    setTimeout(function(){
                        $scope.isProcessing = false;
                        $state.reload();
                }, 1500)  
            }
            // $scope.customerDiscountData.errorMsg = error;            
        })
        setTimeout(function(){
            $scope.customerDiscountData.errorMsg = '';
        }, 2000)
        setTimeout(function(){
            if($scope.isAlertOpened) {
                ngDialog.closeAll();
            }
        }, 5000)
    }
    $scope.calculateBundleCostAndSaveToggle = (productBundleListCategory, k) => {
        $scope.bundleSubTotal = 0;
        let subTotalAmountVar = 0;
        let totalAmountVar = 0;
        $scope.isProcessing = true;
        pAmmount = parseFloat(productBundleListCategory.qty) * parseFloat(productBundleListCategory.unitPrice)
        if(pAmmount > parseFloat(productBundleListCategory.amount)){
            diffammount = pAmmount - parseFloat(productBundleListCategory.amount)
            subTotalAmountVar = parseFloat($scope.quotesDetails.subTotalAmount) + parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.quotesDetails.totalAmount) + parseFloat(diffammount)
        }

        if(pAmmount < parseFloat(productBundleListCategory.amount)){
            diffammount =  parseFloat(productBundleListCategory.amount) - pAmmount
            subTotalAmountVar = parseFloat($scope.quotesDetails.subTotalAmount) - parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.quotesDetails.totalAmount) - parseFloat(diffammount)
        }

        // if(pAmmount == parseFloat(productBundleListCategory.amount)){
        //     $scope.isProcessing = false;
        //     if($scope.quotesDetails.invoiceStatus == "Paid"){
        //         $scope.errorProductForm = 'Paid or partially paid quotes is not updated.';
        //     }
        //     subTotalAmountVar = parseFloat($scope.quotesDetails.subTotalAmount)
        //     totalAmountVar = parseFloat($scope.quotesDetails.totalAmount)
        // }

        productBundleListCategory.amount = parseFloat(pAmmount)
        productBundleListCategory.unitPrice = parseFloat(productBundleListCategory.unitPrice)

        let subTotalAmt  = parseFloat(subTotalAmountVar)
        if($scope.quotesDetails.totalAmount == 0){
            $scope.quotesDetails.totalAmount = subTotalAmt
        }else{
            $scope.quotesDetails.totalAmount = totalAmountVar
        }


        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        }
        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue;
            }else{
                $scope.quotesDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }

        $scope.quotesDetails.balanceDue = $scope.quotesDetails.totalAmount

        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "quotesId":$scope.quotesId,
            "action":"Edit",
            "customerId":$scope.quotesDetails.customerId,
            "addressId":$scope.quotesDetails.serviceAddressId,
            "quotesStatus":$scope.quotesDetails.quotesStatus,
            "subTotalAmount": $scope.quotesDetails.subTotalAmount,
            "totalAmount": $scope.quotesDetails.totalAmount,
            "companyId":auth.getSession().companyId,
            "discountValue": $rootScope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.quotesDetails.balanceDue
        };
        saveInvoiceProductItem = $scope.updatePriceData(saveInvoiceProductItem);
        apiGateWay.send("/edit_quotes", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductForm = response.data.message;
                setTimeout(function() {
                    $scope.successProductForm = "";
                }, 2000);
                $scope.isProcessing = false;
                $scope.productBundleListNew = [];
                $scope.quotesDetails.subTotalAmount = subTotalAmountVar;
                $scope.getQuotesDetails();
            } else {
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
            }
        },function(error) {
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
    }

    $scope.calculateBundleCostAndSaveLableToggle = (productBundleListCategory, k) => {
        $scope.isProcessing = true;
        $scope.quotesDetails.balanceDue = $scope.quotesDetails.totalAmount
        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "quotesId":$scope.quotesId,
            "action":"Edit",
            "customerId":$scope.quotesDetails.customerId,
            "addressId":$scope.quotesDetails.serviceAddressId,
            "quotesStatus":$scope.quotesDetails.quotesStatus,
            "subTotalAmount": $scope.quotesDetails.subTotalAmount,
            "totalAmount": $scope.quotesDetails.totalAmount,
            "companyId":auth.getSession().companyId,
            "discountValue": $rootScope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.quotesDetails.balanceDue,
            "isCommission": $scope.isCommission
        };
        saveInvoiceProductItem = $scope.updatePriceData(saveInvoiceProductItem);
        apiGateWay.send("/edit_quotes", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductForm = response.data.message;
                $scope.isCommission='True';
                setTimeout(function() {
                    $scope.successProductForm = "";
                }, 2000);
                $scope.isProcessing = false;
                $scope.productBundleListNew = [];
                $scope.getQuotesDetails();
            } else {
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
            }
        },function(error) {
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
    }

    $scope.updateBundlePrice = (value, parentIndex)=>{
        if($scope.quotesDetails && $scope.quotesDetails.details.length > 0){
            let total = 0;
            angular.forEach($scope.quotesDetails.details, function(detail, index){
                let lineData = detail.lineData[parentIndex].bundleItemReference;
                angular.forEach(lineData, function(item){
                    //total += parseFloat(item.qty) * parseFloat(item.unitPrice);
                    total += parseFloat(item.qty) * String(item.unitPrice).match(/(\d+)(\.\d+)?/g);
                });
            });
            $scope.quotesDetails.details[0].lineData[parentIndex].unitPrice = total;
        }
    }
    $scope.currencyChangeConverter = (unitPrice,qty, ind) => {
        if (qty) {
            if (qty % 1 !== 0) {
                var _x = qty.toString();  // convert to string for array
                _x = _x.split('.'); // convert to array
                _x = (_x.length > 1) ? _x[0] + '.' + _x[1].substring(0, 2) : qty; // remove extra decimals
                // _x = Number(_x); // convert to number                
                $scope.quotesDetails.details[0].lineData[ind].qty = _x;
            }            
            // var t = qty.toString().replace(/[^\d\.]/g, "");
            let up = 0
            try {
                up =  unitPrice.toString().replace(/\$|,/g, '');
            } catch (error) {
                 up =  unitPrice;
            }
             $scope.lineUnitPrice[ind] = parseFloat(up)*(qty);
        }        
     }

     $scope.currencyChangeConverterBundle = (unitPrice,qty, ind, pind=0) => {
        let up = 0
        try {
            up =  unitPrice.toString().replace(/\$|,/g, '');
        } catch (error) {
             up =  unitPrice;
        }
          $scope.lineUnitPrice[ind] = parseFloat(up)*qty;
          $scope.updateBundlePriceQty(parseFloat(up),qty,pind)
      }

      $scope.updateBundlePriceQty = (value, qty, parentIndex)=>{

         if($scope.quotesDetails && $scope.quotesDetails.details.length > 0){
             let total = 0;
             angular.forEach($scope.quotesDetails.details, function(detail, index){
                 let lineData = detail.lineData[parentIndex].bundleItemReference;
                 angular.forEach(lineData, function(item, i){

                     let up = 0
                        try {
                            up =  item.unitPrice.toString().replace(/\$|,/g, '');
                        } catch (error) {
                            up =  item.unitPrice;
                        }
                     total += parseFloat(item.qty) * parseFloat(up);
                 });
             });
             $scope.quotesDetails.details[0].lineData[parentIndex].unitPrice = total;
         }
     }
    $scope.isJobDeleted = false;
    $scope.isJobDetailsChecking = false;
    $scope.checkJobDetails = function(event) {  
        let isOpenInNewTab = event.ctrlKey || event.metaKey;    
        $scope.isJobDetailsChecking = true;
        apiGateWay.get('/check_quotes_status', {id:$scope.quotesId, companyId:$scope.companyId}).then(function(response) {
            if (response.data.status == 200) {
                let resData = response.data.data.data;
                let customerId = resData.customerId;
                let jobId = resData.jobId;
                if (resData.status == 'Approved' && jobId != null && jobId != '' && jobId != undefined) {
                    $scope.openJobDetails(isOpenInNewTab, customerId, jobId);
                } else {
                    $scope.isJobDeleted = true;
                }
            }            
            $scope.isJobDetailsChecking = false;
        }, function(error) {
            $scope.isJobDetailsChecking = false;
        })
    }  
    $scope.openJobDetails = function(isOpenInNewTab, customerId, jobId) {
        if (isOpenInNewTab){
            var url = "/app/one-time-job/"+customerId+'/'+jobId;
            window.open(url,'_blank');
        }else{
            $state.go("app.onetimejob",{"addressId":customerId,"jobId":jobId}, {reload: true});
        }
    }
    // quote image uploading    
    $scope.awsCDNpath = '';    
    AwsConfigService.fetchAwsConfig().then(function(config) {
        $scope.awsCDNpath = config.domain;
    });
    $scope.quoteImageAwsPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuotes + $rootScope.userSession.companyId+'/' + $scope.quotesId + '/';           
    $scope.quoteImageProcessing = false;
    $scope.quoteLiImageInputChange = function(e) {
        var files = e.target.files;
        var _file = files[0];
        var _extension = _file.name.split(".");
        _extension = _extension[_extension.length - 1];
        _extension = _extension.toLowerCase();
        _allowedExtensions = ['png','jpg','jpeg','gif','pdf'];
        if(_allowedExtensions.includes(_extension)) {
            document.getElementById('quoteImageProcessing_loader').classList.add('show')
            $scope.quoteImageProcessing = true;            
            var _index = e.target.getAttribute("data-index");            
            var _lineitem = $scope.quotesDetails.details[0].lineData[_index];
            if(!_lineitem.photos){ _lineitem.photos = [] }
            var newFileName = $rootScope.getFileNameForUpload(_file.name);   
            newFileName = newFileName + '.' + _extension                  
            let key = $scope.quoteImageAwsPath + newFileName;
            let body = _file;
            AwsS3Utility.upload(key, body)
            .then(function(data) {
                // uploaded 
                _lineitem.photos.push({
                    caption: _extension == 'pdf' ?  _file.name : "",
                    fileName: key,
                    filePath: ""
                });
                $scope.quoteImageProcessing = false;
                $scope.calculateBundleCostAndSave(_lineitem, _index);
                setTimeout(function() {
                    document.getElementById('quoteImageProcessing_loader').classList.remove('show')
                }, 1000)
            })
            .catch(function(error) {
                // error in uploading
                $scope.quoteImageProcessing = false;
                document.getElementById('quoteImageProcessing_loader').classList.remove('show')
                return false;
            })
        } else {
                e.target.value = null;
                $scope.showImageError();
                return;
            } 
    }
    $scope.imageSelectedForDeletion = null;
    $scope.deleteQuoteImagePopup = function(_lineitem, _photo, _index, _cat, _lineItemIndex, _bundleItemIndex) {
        $scope.imageSelectedForDeletion = {
            _lineitem: _lineitem,
            _photo: _photo,
            _index: _index,
            _lineItemIndex: _lineItemIndex, 
            _cat: _cat,
            _bundleItemIndex: _bundleItemIndex
        }
        ngDialog.open({
            template: 'deleteQuoteImageConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                $scope.imageSelectedForDeletion = null;
            }
        });
    };
    $scope.deleteQuoteImage = function() {
        var _photo= $scope.imageSelectedForDeletion._photo;
        var _index= $scope.imageSelectedForDeletion._index;
        var _bundleItemIndex= $scope.imageSelectedForDeletion._bundleItemIndex;
        var _lineItemIndex = $scope.imageSelectedForDeletion._lineItemIndex;
        var _cat = $scope.imageSelectedForDeletion._cat;
        if(_cat == 'bundle'){
            var _lineitem = $scope.quotesDetails.details[0].lineData[_lineItemIndex].bundleItemReference[_bundleItemIndex];
        }
        else{
            var _lineitem= $scope.imageSelectedForDeletion._lineitem;
        }
        ngDialog.closeAll();
        $scope.quoteImageProcessing = true;
        document.getElementById('quoteImageProcessing_loader').classList.add('show')                
        let key = _photo.fileName;
        if (_photo.isOldMethod) {
            key = ($rootScope.isTestServer || $rootScope.isLocalServer ? $scope.env.awsAssetsPrefix : '') + $scope.quotesId + '/' + key
        }
        var photos = [];
        photos.push(key)
        if (photos.length > 0) {
            AwsS3Utility.deleteFiles(photos)
            .then(function(data) {
                // deleted
                data.Deleted.forEach(function(responseItem) {                    
                    const deletedFileName = _photo.fileName;                                      
                    const indexToDelete = _lineitem.photos.findIndex(item => item.fileName.includes(deletedFileName));                                      
                    if (indexToDelete !== -1) {
                        _lineitem.photos.splice(indexToDelete, 1);
                    }
                });                
                $scope.quoteImageProcessing = false;
                $scope.calculateBundleCostAndSave(_lineitem, _index)
                setTimeout(function() {
                    document.getElementById('quoteImageProcessing_loader').classList.remove('show')
                }, 1000)                     
            })
            .catch(function(error) {
                // error in delete
                $scope.quoteImageProcessing = false;
                document.getElementById('quoteImageProcessing_loader').classList.remove('show')
                return false;                           
            });
        }
    }
    $scope.copyQuoteImage = function(newQuoteId) {
        let lineData = $scope.quotesDetails.details[0].lineData;        
        let attachmentsToCopy = [];
        if (lineData && lineData.length > 0) {
            lineData.forEach(function(lineitem){
                let files = lineitem.photos;
                if (files && files.length > 0) {
                    files.forEach(function(file){                        
                        _fileKey = file.fileName;                        
                        let _fileData = {};
                        if (_fileKey.includes('.')) {
                            _fileData.type = 'new';             
                            var _params = _fileKey.split('/');
                            var awsAssetsPrefix = _params[0];
                            var awsAssetsPathQuotes = _params[1];
                            var companyId = _params[2];
                            var quoteId = _params[3];
                            var fileName = _params[4];
                            _fileData.sourceKey = awsAssetsPrefix +'/'+ awsAssetsPathQuotes +'/'+ companyId +'/'+ quoteId +'/'+ fileName;
                            _fileData.destinationKey = awsAssetsPrefix +'/'+ awsAssetsPathQuotes +'/'+ companyId +'/'+ newQuoteId +'/'+ fileName;                            
                        } else {
                            _fileData.type = 'old'; 
                            var _params = _fileKey.split('/');
                            var awsAssetsPrefix = (($rootScope.isTestServer || $rootScope.isLocalServer) ? $scope.env.awsAssetsPrefix : '');                                                        
                            var quoteId = $scope.quotesId;
                            var fileName = _params[0];                 
                            _fileData.sourceKey = awsAssetsPrefix + quoteId +'/'+ fileName
                            _fileData.destinationKey = awsAssetsPrefix + newQuoteId +'/'+ fileName                        
                        }
                        attachmentsToCopy.push(_fileData)          
                    })
                }
            })
        }        
        if (attachmentsToCopy && attachmentsToCopy.length > 0) {
            var items = [];            
            if (attachmentsToCopy.length) {
                angular.forEach(attachmentsToCopy, function(file) {                   
                    items.push({
                        sourceKey: file.sourceKey,
                        destinationKey: file.destinationKey
                    })                                             
                });
            }
            if (items.length > 0) {
                AwsS3Utility.copyFiles(items)
                .then(function(data) {
                    $scope.redirectToNewQuote(newQuoteId)                        
                })
            }                   
        } else {
            $scope.redirectToNewQuote(newQuoteId)
        }
    }
    $scope.showCaptionInput = function(i, cat){
        if(cat == 'bundle'){
            var elems = document.querySelectorAll(".quote-li-img-caption-input-bundle.show");
            [].forEach.call(elems, function(el) {
                el.classList.remove("show");
            });
            var elems = document.querySelectorAll(".quote-li-img-caption-link-bundle.hide");
            [].forEach.call(elems, function(el) {
                el.classList.remove("hide");
            });
            if (document.getElementById('qouteImgInputbundle_'+i+'_caption_input')) {
                document.getElementById('qouteImgInputbundle_'+i+'_caption_input').classList.add('show')
                document.querySelector('#qouteImgInputbundle_'+i+'_caption_input textarea').focus()
            }
            if (document.getElementById('qouteImgInputbundle_'+i+'_caption_link')) {
                document.getElementById('qouteImgInputbundle_'+i+'_caption_link').classList.add('hide')
            }
            if (document.getElementById('qouteImgInputbundle_'+i+'_caption_edit')) {
                document.getElementById('qouteImgInputbundle_'+i+'_caption_edit').classList.add('hide')
            }
            if (document.getElementById('qouteImgInputbundle_'+i+'_caption_text')) {
                document.getElementById('qouteImgInputbundle_'+i+'_caption_text').classList.add('hide')
            }   
        }
        else{
            var elems = document.querySelectorAll(".quote-li-img-caption-input.show");
            [].forEach.call(elems, function(el) {
                el.classList.remove("show");
            });
            var elems = document.querySelectorAll(".quote-li-img-caption-link.hide");
            [].forEach.call(elems, function(el) {
                el.classList.remove("hide");
            });
            if (document.getElementById('qouteImgInput_'+i+'_caption_input')) {
                document.getElementById('qouteImgInput_'+i+'_caption_input').classList.add('show')
                document.querySelector('#qouteImgInput_'+i+'_caption_input textarea').focus()
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_link')) {
                document.getElementById('qouteImgInput_'+i+'_caption_link').classList.add('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_edit')) {
                document.getElementById('qouteImgInput_'+i+'_caption_edit').classList.add('hide')
            }
            if (document.getElementById('qouteImgInput_'+i+'_caption_text')) {
                document.getElementById('qouteImgInput_'+i+'_caption_text').classList.add('hide')
            }
        }
    };
    $scope.saveCaption = function(e, photo, cat, index, parentIndex) {
        var _value = e.target.value;
            $scope.quoteImageProcessing = true;
            document.getElementById('quoteImageProcessing_loader').classList.add('show')
            var _index = e.target.getAttribute("data-index");
            if(cat == 'bundle'){
                var _lineitem = $scope.quotesDetails.details[0].lineData[parentIndex].bundleItemReference[index];
                _lineitem.photos.filter(function(v,i) {
                    if (v.fileName === photo.fileName) {
                        v.caption = _value.trim()
                    }
                });    
                $scope.calculateBundleCostAndSave($scope.quotesDetails.details[0].lineData[parentIndex], _index);
            }
            else{
                var _lineitem = $scope.quotesDetails.details[0].lineData[_index]; 
                _lineitem.photos.filter(function(v,i) {
                    if (v.fileName === photo.fileName) {
                        v.caption = _value.trim()
                    }
                }); 
                $scope.calculateBundleCostAndSave(_lineitem, _index);
            }
            setTimeout(function() {
                $scope.quoteImageProcessing = false;  
                document.getElementById('quoteImageProcessing_loader').classList.remove('show')
            }, 1000)
    }
    $scope.setCommission = function(e) {
        $scope.isCommission='False';
    }
    $scope.redirectToNewQuote = function(quote) {
        $scope.successProductForm = 'Duplicate quote created.';
        $scope.isProcessing = false;
        $rootScope.isCopyingQuote = false;
        setTimeout(function() {
            $state.go("app.customerquotesdetail",{"quoteId": quote}, {reload: true});
        }, 300)
    }
    $scope.galleryPhotos = [];
    $scope.imgPathForImgGllery = '';
    $scope.getPhotosArr = function(arr) {
        let newArr = [];
        if (arr.length > 0) {
            arr.forEach(function(item){
                if (!item.fileName.endsWith('.pdf')) {
                    if (item.isOldMethod) {
                        newArr.push({
                            caption: item.caption,
                            fileName: (($rootScope.isTestServer || $rootScope.isLocalServer) ? $scope.env.awsAssetsPrefix : '') + $scope.quotesId + '/' + item.fileName,
                            filePath: item.filePath                        
                        })
                    } else {                        
                        newArr.push({
                            caption: item.caption,
                            fileName: item.fileName,
                            filePath: item.filePath                        
                        })
                    }
                }                  
            })            
            return newArr

        }
        return arr
    }
    $scope.showFullScreenImages = function(index, photosArr){  
        if (photosArr.length) {
              angular.forEach(photosArr, function(photo, index) {
                if (photo.isOldMethod) {
                    // photo.fullPath = $scope.awsCDNpath + photo.fileName
                } else {
                    photo.fullPath = $scope.awsCDNpath + photo.fileName
                }
            });
        }        
        $scope.galleryPhotos = photosArr;
        $(document).bind('keydown', function (e) {
            var ele = document.getElementsByClassName("full-screen-gallery");
            if(ele.length == 0) return;
            var carouselPrev = document.getElementsByClassName("carousel-prev");
            var carouselNext = document.getElementsByClassName("carousel-next");
            switch (e.key) {
                case 'ArrowLeft':
                    carouselPrev[carouselPrev.length-1].click();
                    break;
                case 'ArrowRight':
                    carouselNext[carouselNext.length-1].click();
            }
        });
        $scope.imageInitialIndex = index;
        ngDialog.open({
            template: 'picturesGallery.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                $scope.imageInitialIndex = 999;
            }
        });
    }
    $scope.showImageError = function() {
        ngDialog.open({
            template: 'showImageError.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {

            }
        });
    }
    $scope.isTotalProcessing = false;
    $scope.toggleChargeTax = function(lineItem, index) {
        $scope.isTotalProcessing = true;
        $scope.isCommission='True';
        $scope.calculateBundleCostAndSave(lineItem, index )
    }
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    var carouselPrev = document.getElementsByClassName("carousel-prev");
    var carouselNext = document.getElementsByClassName("carousel-next");
    var xDown = null;
    var yDown = null;
    function getTouches(evt) {
        return evt.touches ||             // browser API
            evt.originalEvent.touches; // jQuery
    }

    function handleTouchStart(evt) {
        const firstTouch = getTouches(evt)[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    };

    function handleTouchMove(evt) {
        if (!xDown || !yDown) {
            return;
        }
        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;
        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            /*most significant*/
            if (xDiff > 0) {
                /* right swipe */
                carouselNext[carouselNext.length-1].click();
            } else {
                /* left swipe */
                carouselPrev[carouselPrev.length-1].click();
            }
        } else {
            if (yDiff > 0) {
                /* down swipe */
            } else {
                /* up swipe */
            }
        }
        /* reset values */
        xDown = null;
        yDown = null;
    }
    
    // get Quote Commission
    $scope.getQuoteCommisions = function(){
        $scope.isProcessing = true;
        $scope.isTechProcessing = true;
        apiGateWay.get("/quotes_commission", {"quotesId": $scope.quotesDetails.id}).then(function(response) {
            if (response.status == 200) {
                if(response.data.data && response.data.data.items.length > 0){
                    $scope.commisionsDetails = response.data.data;
                } else {
                    $scope.commisionsDetails = response.data.data;
                }
                try {
                    if (response.data.data.saleTechName !== null && response.data.data.saleTechName !== "") {
                        let nameArray = response.data.data.saleTechName.split(' ');
                        $scope.saleTechnician =
                            {
                                "firstName": nameArray[0],
                                "lastName": response.data.data.saleTechName.substring(nameArray[0].length).trim(),
                                "userImage": response.data.data.saleTechImage,
                            }
                    }
                } catch (error) { }
            } else {
                $scope.commisionsDetails = [];
                $scope.saleTechnician = null;
            }
            $scope.getTechnicianListQuotes();
            $scope.isProcessing = false;
            $scope.isTechProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
            $scope.isTechProcessing = false;
        })
    }
    
    var tempFilterText = '', filterTextTimeout;
    $scope.searchTechQuotes = function(searchText){
        if(searchText == $scope.techSearchKeyQuotes || (searchText == $scope.techSearchKeyQuotes && !searchText)){
            return false;
        }         
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        tempFilterText = searchText;
        $scope.techSearchKeyQuotes = tempFilterText;
        $scope.searchTechPayload.offset = 0;
        $scope.searchTechPayload.searchKey = $scope.techSearchKeyQuotes;
        filterTextTimeout = $timeout(function() {
        apiGateWay.get("/technicians", $scope.requiredTechPayload()).then(function(response) {
              if (response.data.status == 200) {
                $scope.searchTechPayload.rows = response.data.data.rows;
                $scope.searchTechPayload.hasMoreData = (($scope.searchTechPayload.offset + 1) * $scope.searchTechPayload.limit) < response.data.data.rows;
                if(response.data.data.data.length > 0) {
                    var rowTech = [];
                    angular.forEach(response.data.data.data, function(tech){
                        if(tech.isActive == 1 && ($scope.commisionsDetails.saleTechId !== null && tech.id !== $scope.commisionsDetails.saleTechId)) {
                            rowTech.push(tech);
                        }
                    });
                    $scope.technicianListQuotes = rowTech;
                } else {
                    $scope.technicianListQuotes = [];
                }
              }
            },
            function(error) {
                $scope.isProcessing = false;
            });
        }, 500); // delay 250 ms
    }
    $scope.isTechSearching = false;
    $scope.searchTechPayload = {
        status: 'Active', 
        offset: 0, 
        limit: 5, 
        searchKey: $scope.techSearchKeyQuotes,
        rows: 0,
        hasMoreData: false
    }
    $scope.requiredTechPayload = () => {
        let payload = angular.copy($scope.searchTechPayload)
        delete payload.rows
        delete payload.hasMoreData
        return payload;
    }
    $scope.loadMoreTechnicians = () => {
        $scope.isTechSearching = true;
        $scope.searchTechPayload.offset = $scope.searchTechPayload.offset + 1;
        apiGateWay.get("/technicians", $scope.requiredTechPayload()).then(function(response) {
            if (response.data.status == 200) {
              $scope.searchTechPayload.rows = response.data.data.rows;
              $scope.searchTechPayload.hasMoreData = (($scope.searchTechPayload.offset + 1) * $scope.searchTechPayload.limit) < response.data.data.rows;
              if(response.data.data.data.length > 0) {
                  var rowTech = [];
                  angular.forEach(response.data.data.data, function(tech){
                      if(tech.isActive == 1 && ($scope.commisionsDetails.saleTechId !== null && tech.id !== $scope.commisionsDetails.saleTechId)) {
                          rowTech.push(tech);
                      }
                  });
                //   $scope.technicianList = rowTech;
                  angular.forEach(rowTech, (elementProduct, indexofservice) => {
                    if($scope.technicianListQuotes.indexOf(elementProduct) === -1) {
                        $scope.technicianListQuotes.push(elementProduct);
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
    //to get technician list
    $scope.getTechnicianListQuotes = function() {
        $scope.isTechProcessing = true;
        apiGateWay.get("/technicians", $scope.requiredTechPayload()).then(function(response) {
              if (response.data.status == 200) {
                $scope.searchTechPayload.rows = response.data.data.rows;
                $scope.searchTechPayload.hasMoreData = (($scope.searchTechPayload.offset + 1) * $scope.searchTechPayload.limit) < response.data.data.rows;
                if(response.data.data.data.length > 0) {
                    var rowTech = [];
                    angular.forEach(response.data.data.data, function(tech){
                        if(tech.isActive == 1 && ($scope.commisionsDetails.saleTechId !== null && tech.id !== $scope.commisionsDetails.saleTechId)) {
                            rowTech.push(tech);
                        }
                    });
                    $scope.technicianListQuotes = rowTech;
                    $scope.assignSaleTechnician();
                } else {
                    $scope.technicianListQuotes = [];
                }
                $scope.isTechProcessing = false;
              } else {
                $scope.technicianListQuotes = [];
                $scope.isTechProcessing = false;
              }
            },
            function(error) {
                $scope.isTechProcessing = false;
            }
          );
      };
    
      
      $scope.assignSaleTechnician = function() {
        angular.forEach($scope.technicianListQuotes, function(tech){
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
      
      $scope.updateQuoteTechCommission = function(comType, cid, value, isDropDown){
        var postData = {};
        if (isDropDown) {
            postData = {
                quotesId: parseInt($scope.quotesId),
                commType: comType,
                techId: parseInt(cid), 
            };
            if (comType === "sale") {
              $scope.saleTechnician = null;
              angular.forEach($scope.technicianListQuotes, function (tech) {
                if (tech.id === cid) {
                  $scope.saleTechnician = tech;
                }
              });
              $scope.techSearchBoxQuotes.techSearchText  = "";
              $scope.techSearchKeyQuotes = "";
              $scope.searchTechPayload.offset = 0;
              $scope.searchTechPayload.searchKey = "";
            }
        } else {
            postData = {
                quotesId: parseInt($scope.quotesId),
                commType: comType,
                itemId: parseInt(cid),
                itemValue: value ? value : 0.00,
            };
        }
        $scope.isTechProcessing = true;
        apiGateWay.send('/update_quote_sales_pay', postData).then(function(response) {
            if(response.data.data && response.data.data.commissionData.items.length > 0){
                var row = [];
                response.data.data.commissionData.items.forEach(function(element, index){
                    row.push(element);
                });
                response.data.data.commissionData.items = row;
                $scope.commisionsDetails = response.data.data.commissionData;
            } else {
                $scope.commisionsDetails = response.data.data.commissionData;
            }
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
            if ($scope.techSearchBoxQuotes.techSearchText && $scope.techSearchBoxQuotes.techSearchText.length > 0) {
                $scope.techSearchBoxQuotes.techSearchText = "";
                $scope.techSearchKeyQuotes = "";
                $scope.searchTechPayload.searchKey = "";
            }
            $scope.isTechProcessing = false;
            $scope.getTechnicianListQuotes();
        }, function(error){
            $scope.isTechProcessing = false;
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
  });
  $scope.updatePriceData = (data) => {
    let _data = data;
    if (_data && _data.action == 'Edit' && _data.itemReference && _data.itemReference.unitPrice) {
        _data.itemReference.price = _data.itemReference.unitPrice; // Product, Services, Bundle
        if (_data.itemReference.category == 'Bundle') { // Bundle items
            _data.itemReference.price = _data.itemReference.unitPrice;
            let bundle = _data.itemReference.bundleItemReference && _data.itemReference.bundleItemReference.length > 0 ? _data.itemReference.bundleItemReference : [];
            bundle.forEach(function (item){
                item.unitPrice = item.unitPrice.toString();
                item.unitPrice = item.unitPrice.replace('$', '');
                item.unitPrice = Number(item.unitPrice);
                item.price = item.unitPrice;
            })
            _data.itemReference.bundleItemReference = bundle;
        }
    }
    return _data;
  }
    $scope.openQuoteNoteTab = function(tab) {
        $scope.quoteNotesTab = tab;
    }
    $scope.quoteNotesTab = 'quotes';  
    $scope.cachedEmailForReplyAskedQuestion = '';
    $scope.questionModel = {
        emailForReplyAskedQuestion: '',
        question: ''
    }
    $scope.askQuestionModal = null;
    $scope.askQuestionModalOpen = function() {    
    $scope.askQuestionModal = ngDialog.open({        
        template: 'askQuestionModal.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function () {
            $scope.questionModel.emailForReplyAskedQuestion = $scope.cachedEmailForReplyAskedQuestion;
            $scope.questionModel.question = '';
            $scope.questionModelError = '';
            $scope.questionModelSucess = '';
            $scope.questionModelSubmtting = false;
        }
    });
    }
    $scope.questionModelSubmtting = false;
    $scope.questionModelSucess = '';
    $scope.questionModelError = '';
    $scope.submitQuestionToCompany = function() {
        $scope.questionModelSubmtting = true;
        let payload = {
            replyEmail: $scope.questionModel.emailForReplyAskedQuestion,
            question: $scope.questionModel.question,
            quoteId: Number($scope.quotesId),
            customerId: Number($scope.quotesDetails.customerId),
            companyId: Number($scope.companyId) 
        }
        $scope.questionModelError = '';
        $scope.questionModelSucess = '';
        apiGateWay.send('/quote_ask_question', payload).then(function(response) {
            $scope.questionModelSubmtting = false;
            $scope.questionModelSuccess = 'Question sent successfully.';
            $timeout(function(){
                $scope.askQuestionModal.close();
                $scope.questionModelSuccess = '';
            }, 2000)
        }, function(error){
            $scope.questionModelSubmtting = false;
            $scope.questionModelError = typeof error == 'string' ? error : 'Something went wrong. Please try again.';
            $timeout(function(){
                $scope.questionModelError = '';
            }, 1000)
        })
    }
    $scope.downloadPDFfromLineItem = function(link) {
        window.location.href = link
    }
    $scope.quoteTemplatesList = [];
    $scope.selectedTemplate = null; 
    $scope.getQuoteTemplatesListOnQuotePage = function(selectedTemplateId=0) {   
      $scope.quoteTemplatesList                     
      apiGateWay.get("/quote_template_settings").then(function(response) {
          if (response.data.status == 200) {   
              $scope.quoteTemplatesList = [];
              let quoteTemplatesList = response.data.data.customTemplate ? response.data.data.customTemplate : []; 
              quoteTemplatesList.forEach(function(template){
                let data = {                       
                    "discountTitle": template.discountTitle,
                    "discountValue": template.discountValue,
                    "id": template.id,
                    "lineData": template.lineData,
                    "officeNotes": template.officeNotes,
                    "quoteNotes": template.quoteNotes,
                    "subTotalAmount": template.subTotalAmount,
                    "techNotes": template.techNotes,
                    "templateName": template.templateName,
                    "quotesTitle": template.title,
                    "totalAmount": template.totalAmount
                }                
                $scope.quoteTemplatesList.push(data)
                if (selectedTemplateId == template.id) {
                    $scope.selectedTemplate = template
                } 
              })                           
          }          
      }, function(error) {        
      });
    }  
    $scope.selectedTemplateForApply = null;
    $scope.applyTemplate = function(template) {
        if(template.subTotalAmount < 0) {
            $scope.errorProductForm = "The quote total can't be less than $0.00";
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            return;
        }
        $scope.selectedTemplateForApply = template;        
        $scope.confirmTemplateApply = ngDialog.open({
            template: 'confirmTemplateApplyModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $timeout(function(){
                    $scope.selectedTemplateForApply = null;
                },50)
            }
        })
    }  
    $scope.applyTemplateConfirmed = function(template) {
        $scope.selectedTemplate = template;
        let payload = {
            quoteId: $scope.quotesId,
            templateId: template.id,
            addressId: $scope.quotesDetails.serviceAddressId
        }
        $scope.isProcessing = true;
        ngDialog.closeAll();
        $scope.selectedTemplateForApply = null;
        apiGateWay.get('/quote_by_template', payload).then(function(){
            $scope.successMsg = 'Template applied';
            // 
            var oldPrefix = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuoteTemplates + $rootScope.userSession.companyId+'/' + template.id + '/';
            var newPrefix = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathQuotes + $rootScope.userSession.companyId+'/' + $scope.quotesId + '/';
            AwsS3Utility.list([oldPrefix])
            .then(function(data) {
                // loaded
                if (data[0].Contents.length) {
                    var items = [];
                    angular.forEach(data[0].Contents, function(file, cb) {                        
                        let copySource = file.Key;
                        let key = file.Key.replace(oldPrefix, newPrefix);
                        items.push({
                            sourceKey: copySource,
                            destinationKey: key
                        })                                             
                    });
                    if (items.length > 0) {
                        AwsS3Utility.copyFiles(items)
                        .then(function(data) {
                            // copied
                            $state.reload()                 
                        })
                    }                   
                } else {
                    $state.reload()
                }
            })                           
        }, error = function(error){
            $scope.isProcessing = false;
            $scope.error = typeof error == 'string' ? error : 'Something went wrong';
            $timeout(function(){
                $scope.error = '';
            },2000)
        })
    }
    $scope.getSanitizedId = function(string, isOldMethod) {   
        if (isOldMethod) {
            return string
        }
        if (string) {
            const filename = string.match(/\/([^/]+)\.\w+$/)[1];        
            return filename
        }     
        return string
    }
    $scope.allQuotesDetails = []; 
    $scope.$watch('quotesDetails', function(newTitle) { 
        $scope.allQuotesDetails = []; 
        $scope.allQuotesDetails.push($scope.quotesDetails)         
    }); 
    $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'quotesDetail') {    
            if (data.isClose) {
                $scope.bundleSearchForm = false                
                return
            }
            
            let totalCheck = 0;
            if (data.bundleItemReference && data.bundleItemReference.length > 0) {
               let total = 0;
               angular.forEach(data.bundleItemReference, function(item){
                item.unitPrice = (typeof item.price === "number") ? item.price : parseFloat(item.price.replace(/[^0-9.-]/g, ''));
                total += (item.qty) * (item.unitPrice);
               });
              totalCheck = $scope.quotesDetails.subTotalAmount + total;
           } else {
            totalCheck = $scope.quotesDetails.subTotalAmount + data.price;
          }
         if (totalCheck < 0) {          
          $scope.errorProductForm = "The quote total can't be less than $0.00";
          setTimeout(function() { 
            $scope.errorProductForm   = "";
           }, 2000);
        } else {
            $scope.addProductToBundle(data);
        }
        }
    }); 
    $scope.copySuccessMsg = '';
    $scope.copyPublicUrl = async () => {                     
        let str = $scope.quotesDetails.quoteUrl ? $scope.quotesDetails.quoteUrl : '';
        $scope.copySuccessMsg = '';
        function fallbackCopyTextToClipboard(text) {
          var textArea = document.createElement("textarea");
          textArea.value = text;          
          textArea.style.top = "0";
          textArea.style.left = "0";
          textArea.style.position = "fixed";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            if (successful) {
              $scope.copySuccessMsg = 'URL copied';
              $timeout(function() {
                $scope.copySuccessMsg = ''
              }, 5000)
            } else {
              console.error('copy failed')
            }
          } catch (err) {
            console.error('copy failed')
          }
          document.body.removeChild(textArea);
        }
        function copyTextToClipboard(text) {
          if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
          }
          navigator.clipboard.writeText(text).then(function() {
            $scope.copySuccessMsg = 'URL copied';
            $timeout(function() {
              $scope.copySuccessMsg = ''
            }, 5000)
          }, function(err) {
            console.error('copy failed')
          });
        }
        copyTextToClipboard(str)
    }
    
    $rootScope.openQuoteAuditLog = () => {
        $scope.quoteAuditPopup();
    }

    $scope.quoteAuditPopup = function() {
        ngDialog.open({
          template: 'quoteAuditPopup.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
    
    $scope.getQuoteAuditLogs = function() {
        $scope.quoteLogLoading = true;
        let jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            addressId: $scope.addressId,
            quoteId: $scope.quotesId,
        };
        apiGateWay.get("/get_quote_audit_logs", jobParam).then(function(response) {
            if (response.data.status == 200) {
                $scope.quoteLogLoading = false;                
                let quoteAuditResponse = response.data.data;
                $scope.quoteAuditList = $scope.updateLastNames(quoteAuditResponse.data);
                $scope.pageObj.totalRecordInv = quoteAuditResponse.rows;
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0; 
            } else {
                $scope.quoteLogLoading = false;
            }
        }, function(error){
            $scope.quoteLogLoading = false;
        });
    }

    $scope.goToQuoteAuditListPage = function(page) {
        $scope.pageObj.currentPageInv = page;
        $scope.getQuoteAuditLogs();
    };
    
    $scope.updateLastNames = function(data) {
        return data.map(function(item) {
            // Check if actionBy is not -1 or not -3 and lastName is present
            if ((item.actionBy !== -1 || item.actionBy !== -3) && item.lastName) {
                item.lastName = item.lastName.charAt(0).toUpperCase() + '.';
            }
            return item;
        });
    }
    
});
