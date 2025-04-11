angular.module('POOLAGENCY').controller('oneJobReportController', function($scope,$state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog,Analytics,  $window) {
    $scope.countNotStarted = 0;
    $scope.amountNotStarted = 0.00;
    $scope.countInProgress = 0;
    $scope.amountInProgress = 0.00;
    $scope.countCompleted = 0;
    $scope.amountCompleted = 0.00;
    $scope.countClosed = 0;
    $scope.amountClosed = 0.00;
    $scope.countNoAccess = 0;
    $scope.amountNoAccess = 0.00;
    $scope.filterReportDataJob = ['1 week','1 month','90 days', '6 months', '1 year', 'custom'];
    $scope.filterDuration = '1 month';
    $scope.isProcessingJobReport = true;
    $scope.fromDateJob = '';
    $scope.toDateJob = '';
    $scope.filterReportDataQuote = ['1 week','1 month','90 days', '6 months', '1 year', 'custom'];
    $scope.filterDurationQuote = '1 month';
    $scope.isProcessingQuoteReport = true;
    $scope.fromDateQuote = '';
    $scope.toDateQuote = '';
    $scope.quotesStatusData = {
        open : {
            amount: 0,
            count: 0,
        },
        closed : {
            amount: 0,
            count: 0,
        },
        approved : {
            amount: 0,
            count: 0,
        },
        denied : {
            amount: 0,
            count: 0,
        },
    };
    $scope.filterReportDataInvoice = ['1 week','1 month','90 days', '6 months', '1 year', 'custom'];
    $scope.filterDurationInvoice = '1 month';
    $scope.isProcessingInvoiceReport = true;
    $scope.fromDateInvoice = '';
    $scope.toDateInvoice = '';
    $scope.invoiceStatusData = {
        notPaid : {
            amount: 0,
            count: 0,
        },
        paid : {
            amount: 0,
            count: 0,
        },
        pastDue : {
            amount: 0,
            count: 0,
        },
        unsent : {
            amount: 0,
            count: 0,
        },
        upcoming : {
            amount: 0,
            count: 0, 
        }
    };
    $scope.filterReportDataPayment = ['1 week','1 month','90 days', '6 months', '1 year', 'custom'];
    $scope.filterDurationPayment = '1 month';
    $scope.isProcessingPaymentReport = true;
    $scope.fromDatePayment = '';
    $scope.toDatePayment = '';
    $scope.paymentStatusData = {
        unapplied : {
            amount: 0,
            count: 0,
        },
        applied : {
            amount: 0,
            count: 0,
        },
        partial : {
            amount: 0,
            count: 0,
        },
        refunds : {
            amount: 0,
            count: 0,
        },
    };
    $scope.filterByDuration = function(filterDuration){
        $scope.fromDateJob = "";
        $scope.toDateJob = "";
        $scope.filterDuration = filterDuration;
        if($scope.filterDuration!='custom'){
            $scope.isProcessingJobReport = true;
            $scope.getOneJobStatus();
        } else {
            $timeout(function() {
                angular.element(document.getElementById('fromDateInputJob')).focus();
            });   
        }
    }
    $scope.filterByDurationQuote = function(filterDuration){
        $scope.fromDateQuote = "";
        $scope.toDateQuote = "";
        $scope.filterDurationQuote = filterDuration;
        if($scope.filterDurationQuote!='custom'){
            $scope.isProcessingQuoteReport = true;
            $scope.getQuotesStatus();
        } else {
            $timeout(function() {
                angular.element(document.getElementById('fromDateInputQuote')).focus();
            });   
        }
    }    
    $scope.filterByDurationInvoice = function(filterDuration){
        $scope.fromDateInvoice = "";
        $scope.toDateInvoice = "";
        $scope.filterDurationInvoice = filterDuration;
        if($scope.filterDurationInvoice!='custom'){
            $scope.isProcessingInvoiceReport = true;
            $scope.getInvoiceStatus();
        } else {
            $timeout(function() {
                angular.element(document.getElementById('fromDateInputInvoice')).focus();
            });   
        }
    }   
    $scope.filterByDurationPayment = function(filterDuration){
        $scope.fromDatePayment = "";
        $scope.toDatePayment = "";
        $scope.filterDurationPayment = filterDuration;
        if($scope.filterDurationPayment!='custom'){
            $scope.isProcessingPaymentReport = true;
            $scope.getPaymentStatus();
        } else {
            $timeout(function() {
                angular.element(document.getElementById('fromDateInputPayment')).focus();
            });   
        }
    }
    $scope.filterReport = function(){
    }
    $(document).ready(function() {
        $('.input-daterange').datepicker({
            autoclose: true,
            endDate: moment().format('MM-YYYY'),
            todayBtn: "linked"
        });
    });
    $scope.fromDateJob = "";
    $scope.toDateJob = "";
    
    $scope.clickDateJob = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.clickDateQuote = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.clickDateInvoice = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.clickDatePayment = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    
    $scope.filterByDateJob = function(p) {
        if ($scope.fromDateJob != '' && $scope.toDateJob != '') {
            var fromDateJob = new Date($scope.fromDateJob)
            var toDateJob = new Date($scope.toDateJob);
            if (fromDateJob <= toDateJob) {
                $scope.isProcessingJobReport = true;
                $scope.filterDuration = 'custom';               
                $scope.getOneJobStatus();
            } else {
                if (p == 'fromDateJob') {
                    $scope.fromDateJob = '';
                } else {
                    $scope.toDateJob = '';
                }
            }
        } else {
            if ($scope.fromDateJob == '' && $scope.toDateJob == '') {
                $scope.isProcessingJobReport = true;
                $scope.getOneJobStatus();
            }
        }
    };
    $scope.filterByDateQuote = function(p) {
        if ($scope.fromDateQuote != '' && $scope.toDateQuote != '') {
            var fromDateQuote = new Date($scope.fromDateQuote)
            var toDateQuote = new Date($scope.toDateQuote);
            if (fromDateQuote <= toDateQuote) {
                $scope.isProcessingQuoteReport = true;
                $scope.filterDurationQuote = 'custom';               
                $scope.getQuotesStatus();
            } else {
                if (p == 'fromDateQuote') {
                    $scope.fromDateQuote = '';
                } else {
                    $scope.toDateQuote = '';
                }
            }
        } else {
            if ($scope.fromDateQuote == '' && $scope.toDateQuote == '') {
                $scope.isProcessingQuoteReport = true;
                $scope.getQuotesStatus();
            }
        }
    };
    $scope.filterByDateInvoice = function(p) {
        if ($scope.fromDateInvoice != '' && $scope.toDateInvoice != '') {
            var fromDateInvoice = new Date($scope.fromDateInvoice)
            var toDateInvoice = new Date($scope.toDateInvoice);
            if (fromDateInvoice <= toDateInvoice) {
                $scope.isProcessingInvoiceReport = true;
                $scope.filterDurationInvoice = 'custom';               
                $scope.getInvoiceStatus();
            } else {
                if (p == 'fromDateInvoice') {
                    $scope.fromDateInvoice = '';
                } else {
                    $scope.toDateInvoice = '';
                }
            }
        } else {
            if ($scope.fromDateInvoice == '' && $scope.toDateInvoice == '') {
                $scope.isProcessingInvoiceReport = true;
                $scope.getInvoiceStatus();
            }
        }
    };
    
    $scope.filterByDatePayment = function(p) {
        if ($scope.fromDatePayment != '' && $scope.toDatePayment != '') {
            var fromDatePayment = new Date($scope.fromDatePayment)
            var toDatePayment = new Date($scope.toDatePayment);
            if (fromDatePayment <= toDatePayment) {
                $scope.isProcessingPaymentReport = true;
                $scope.filterDurationPayment = 'custom';               
                $scope.getPaymentStatus();
            } else {
                if (p == 'fromDatePayment') {
                    $scope.fromDatePayment = '';
                } else {
                    $scope.toDatePayment = '';
                }
            }
        } else {
            if ($scope.fromDatePayment == '' && $scope.toDatePayment == '') {
                $scope.isProcessingPaymentReport = true;
                $scope.getPaymentStatus();
            }
        }
    };
    $scope.getOneJobStatus = function() {
        var jobParam = {
            filterDuration:$scope.filterDuration
        };
        if ($scope.fromDateJob != '' && $scope.toDateJob != '') {
            jobParam.filterStartDate = $filter('date')(new Date($scope.fromDateJob), 'yyyy-MM-dd');
            jobParam.filterEndDate = $filter('date')(new Date($scope.toDateJob), 'yyyy-MM-dd');
        }

        apiGateWay.get("/one_job_report", jobParam).then(function(response) {
            if (response.data.status == 200) {
                var jobStatusResponse = response.data.data;
                $scope.countNotStarted = 0;
                $scope.amountNotStarted = 0.00;
                $scope.countInProgress = 0;
                $scope.amountInProgress = 0.00;
                $scope.countCompleted = 0;
                $scope.amountCompleted = 0.00;
                $scope.countClosed = 0;
                $scope.amountClosed = 0.00;
                $scope.countNoAccess = 0;
                $scope.amountNoAccess = 0.00;
                jobStatusResponse.forEach(function(item){
                    if(item.jobStatus == 1){
                        $scope.countNotStarted = item.jobStatusCount;
                        $scope.amountNotStarted = item.jobStatusAmount > 0 ? item.jobStatusAmount : 0.00;
                    }
                    if(item.jobStatus == 2){
                        $scope.countNoAccess = item.jobStatusCount;
                        $scope.amountNoAccess = item.jobStatusAmount > 0 ? item.jobStatusAmount : 0.00;
                    }
                    if(item.jobStatus == 3){
                        $scope.countInProgress = item.jobStatusCount;
                        $scope.amountInProgress = item.jobStatusAmount > 0 ? item.jobStatusAmount : 0.00;
                    }
                    if(item.jobStatus == 4){
                        $scope.countCompleted = item.jobStatusCount;
                        $scope.amountCompleted = item.jobStatusAmount > 0 ? item.jobStatusAmount : 0.00;
                    }
                    if(item.jobStatus == 5){
                        $scope.countClosed = item.jobStatusCount;
                        $scope.amountClosed = item.jobStatusAmount > 0 ? item.jobStatusAmount : 0.00;
                    }
                });
            }
            $scope.isProcessingJobReport = false;
            
        },function(error){
        });
    };
    $scope.getQuotesStatus = function() {
        var jobParam = {
            filterDuration: $scope.filterDurationQuote
        };
        if ($scope.fromDateQuote != '' && $scope.toDateQuote != '') {
            jobParam.filterStartDate = $filter('date')(new Date($scope.fromDateQuote), 'yyyy-MM-dd');
            jobParam.filterEndDate = $filter('date')(new Date($scope.toDateQuote), 'yyyy-MM-dd');
        }

        apiGateWay.get("/quotes_report", jobParam).then(function(response) {
            $scope.quotesStatusData = {
                open : {
                    amount: 0,
                    count: 0,
                },
                closed : {
                    amount: 0,
                    count: 0,
                },
                approved : {
                    amount: 0,
                    count: 0,
                },
                denied : {
                    amount: 0,
                    count: 0,
                },
            };
            angular.forEach(response.data.data.statusCount, function(item, index) {
                if(item.status === 'Open') {
                    $scope.quotesStatusData.open.amount = item.amount;
                    $scope.quotesStatusData.open.count = item.count;
                }
                if(item.status === 'Closed') {
                    $scope.quotesStatusData.closed.amount = item.amount;
                    $scope.quotesStatusData.closed.count = item.count;
                }
                if(item.status === 'Approved') {
                    $scope.quotesStatusData.approved.amount = item.amount;
                    $scope.quotesStatusData.approved.count = item.count;
                }
                if(item.status === 'Denied') {
                    $scope.quotesStatusData.denied.amount = item.amount;
                    $scope.quotesStatusData.denied.count = item.count;
                }
            });
            $timeout(function() {
                $scope.isProcessingQuoteReport = false;
            }, 1000);            
        },function(error){
        });
    };    
    $scope.getInvoiceStatus = function() {
        var jobParam = {
            filterDuration: $scope.filterDurationInvoice
        };
        if ($scope.fromDateInvoice != '' && $scope.toDateInvoice != '') {
            jobParam.filterStartDate = $filter('date')(new Date($scope.fromDateInvoice), 'yyyy-MM-dd');
            jobParam.filterEndDate = $filter('date')(new Date($scope.toDateInvoice), 'yyyy-MM-dd');
        }

        apiGateWay.get("/invoice_report", jobParam).then(function(response) {
            $scope.invoiceStatusData = {
                notPaid : {
                    amount: 0,
                    count: 0,
                },
                paid : {
                    amount: 0,
                    count: 0,
                },
                pastDue : {
                    amount: 0,
                    count: 0,
                },
                unsent : {
                    amount: 0,
                    count: 0,
                },
                upcoming : {
                    amount: 0,
                    count: 0, 
                }
            };
            angular.forEach(response.data.data, function(item, index) {
                if(item.invoiceStatus === 'Awaiting Payment') {
                    $scope.invoiceStatusData.notPaid.amount = item.amount;
                    $scope.invoiceStatusData.notPaid.count = item.count;
                }
                if(item.invoiceStatus === 'Unsent') {
                    $scope.invoiceStatusData.unsent.amount = item.amount;
                    $scope.invoiceStatusData.unsent.count = item.count;
                }
                if(item.invoiceStatus === 'Past Due') {
                    $scope.invoiceStatusData.pastDue.amount = item.amount;
                    $scope.invoiceStatusData.pastDue.count = item.count;
                }
                if(item.invoiceStatus === 'Paid') {
                    $scope.invoiceStatusData.paid.amount = item.amount;
                    $scope.invoiceStatusData.paid.count = item.count;
                }
                if(item.invoiceStatus === 'Upcoming') {
                    $scope.invoiceStatusData.upcoming.amount = item.amount;
                    $scope.invoiceStatusData.upcoming.count = item.count;
                }
            });
            $timeout(function() {
                $scope.isProcessingInvoiceReport = false;
            }, 1000);            
        },function(error){
        });
    };   
    $scope.getPaymentStatus = function() {
        var jobParam = {
            filterDuration: $scope.filterDurationPayment
        };
        if ($scope.fromDatePayment != '' && $scope.toDatePayment != '') {
            jobParam.filterStartDate = $filter('date')(new Date($scope.fromDatePayment), 'yyyy-MM-dd');
            jobParam.filterEndDate = $filter('date')(new Date($scope.toDatePayment), 'yyyy-MM-dd');
        }

        apiGateWay.get("/payment_Reports", jobParam).then(function(response) {
            $scope.paymentStatusData = {
                unapplied : {
                    amount: 0,
                    count: 0,
                },
                applied : {
                    amount: 0,
                    count: 0,
                },
                partial : {
                    amount: 0,
                    count: 0,
                },
                refunds : {
                    amount: 0,
                    count: 0,
                },
            };
            angular.forEach(response.data.data, function(item, index) {
                // 0-unapplied,1-paid/applied,2-partial,3-refund
                if(item.applied === 0) { 
                    $scope.paymentStatusData.unapplied.amount = item.paymentStatusUnApplied;
                    $scope.paymentStatusData.unapplied.count = item.paymentStatusCount;
                }
                if(item.applied === 1) {
                    $scope.paymentStatusData.applied.amount = item.paymentStatusApplied;
                    $scope.paymentStatusData.applied.count = item.paymentStatusCount;
                }
                if(item.applied === 2) {
                    $scope.paymentStatusData.partial.amount = item.paymentStatusPartial;
                    $scope.paymentStatusData.partial.count = item.paymentStatusCount;
                }
                if(item.applied === 3) {
                    $scope.paymentStatusData.refunds.amount = item.paymentStatusRefund;
                    $scope.paymentStatusData.refunds.count = item.paymentStatusCount;
                }
            });
            $timeout(function() {
                $scope.isProcessingPaymentReport = false;
            }, 1000);            
        },function(error){
        });
    };
    $scope.clickJobStatus = function(jobStatus, jobStatusTitle) {
        $rootScope.jobStatus = jobStatus;
        $rootScope.jobStatusTitle = jobStatusTitle;
        $rootScope.filterDuration = $scope.filterDuration;
        $rootScope.fromDateJob = $scope.fromDateJob;
        $rootScope.toDateJob = $scope.toDateJob;
        if ($rootScope.filterDuration === 'custom') {
            $rootScope._showfuturedata = 0;
            $rootScope._hideShowDatesText = 'Show future dates';
            $rootScope._hideShownDatesText = false;
        } else {
            $rootScope._showfuturedata = 1;
            $rootScope._hideShowDatesText = 'Hide future dates';
            $rootScope._hideShownDatesText = true;
        }
        $state.go('app.onetimejoblist');
    }
    
    $scope.clickQuoteStatus = function(status) {
        $rootScope.param_quoteStatus = status;
        $rootScope.param_filterDurationQuote = $scope.filterDurationQuote;
        $rootScope.param_fromDateQuote = $scope.fromDateQuote;
        $rootScope.param_toDateQuote = $scope.toDateQuote;
        $state.go('app.quotelistingSingle');
    }
    $scope.clickInvoiceStatus = function(status) {
        $rootScope.param_invoiceStatus = status;
        $rootScope.param_filterDurationInvoice = $scope.filterDurationInvoice;
        $rootScope.param_fromDateInvoice = $scope.fromDateInvoice;
        $rootScope.param_toDateInvoice = $scope.toDateInvoice;
        $rootScope.listingTab.invoice = false;
        $state.go('app.invoicelistingSingle');
    }

    $scope.clickPaymentStatus = function(status) {        
        $rootScope.param_paymentStatus = status;
        $rootScope.param_filterDurationPayment = $scope.filterDurationPayment;
        $rootScope.param_fromDatePayment = $scope.fromDatePayment;
        $rootScope.param_toDatePayment = $scope.toDatePayment;
        $rootScope.listingTab.Payment = false;
        $state.go('app.paymentlistingSingle');
    }

    $scope.reloadPage = function(){
        $window.location.reload();
    }
    
});
