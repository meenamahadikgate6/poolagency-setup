angular.module('POOLAGENCY').controller('reportsController', function($scope,$state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog,Analytics,  $window, auth) {
    $scope.activeCustomers = 0;
    $scope.jobsCompleted = 0;
    $scope.propertyServiced = 0;
    $scope.filterReportData = ['custom','1 month','90 days', '6 months', '1 year'];
    $scope.filterMonth = '1 month';
    $scope.filterMonthFb = '1 month';
    $scope.seriesData = [];
    $scope.reportMode = 'spent';    
    $scope.isProcessing = false;
    $scope.isDownloadingChemicalReoprt = false;
    $scope.isDownloadingReoprt = false;
    $scope.feedbackData = [];
    $scope.isProcessingFeedback = false;
    $scope.isDownloadingFeedbackReoprt = false;
    $scope.canView = false;
    $rootScope.hasFeedback = false;
    $scope.feedbackList = [];
    let _session = auth.getSession();
    if (_session.userType == "administrator" || _session.canViewRouteProfitReport == 1) {
        $scope.canView = true
    }
    $scope.pageObj =  {
        currentPage: 1,
        page: '',
        limit: 15,
        totalRecord: '',
        totalPage: '',
        dir: 'asc',  
        column: 'percentage',
        fromDate: '',
        toDate: '',
        lowProfitPercentage: 40,
        profitFilter: ['profitable', 'lowprofit', 'losingmoney'],
        month: moment(new Date()).subtract(1, 'months').toDate(),
        filterReportData: ['Month','custom'],
        filterMonth: 'Month'
    }
    $scope.filterByDays = function(){
        $scope.fromDate = "";
        $scope.toDate = "";
        if($scope.filterMonth!='custom'){
            $scope.getChemicalCost("filterByDate");
        }
        
        else{
            $timeout(function() {
                angular.element(document.getElementById('fromDateInput')).focus();
            });
            
        }
    }
    $scope.pageObjFb =  {
        currentPage: 1,
        page: '',
        limit: 15,
        totalRecord: '',
        totalPage: '',
        dir: 'asc',  
        column: 'percentage',
        fromDate: '',
        toDate: '',
        lowProfitPercentage: 40,
        profitFilter: ['profitable', 'lowprofit', 'losingmoney'],
        month: moment(new Date()).startOf('month').toDate(),
        filterReportData: ['Month','custom'],
        filterMonth: 'Month'
    }
    $scope.filterByDaysFb = function(filterMonth){
        $scope.filterMonthFb = filterMonth;
        if($scope.filterMonthFb!='custom'){
            $scope.pageObjFb.fromDate = '';
            $scope.pageObjFb.toDate = '';
            $scope.getFeedbackReport();
        } else {
          $timeout(function() {
             angular.element(document.getElementById('fromDateInputFeedback')).focus();
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
    $scope.fromDate = "";
    $scope.toDate = "";

    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.filterByDate = function(p) {
        if ($scope.fromDate != '' && $scope.toDate != '') {
            var fromDate = new Date($scope.fromDate)
            var toDate = new Date($scope.toDate);
            if (fromDate <= toDate) {
                $scope.filterMonth = 'custom';               
                $scope.getChemicalCost("filterByDate");
            } else {
                if (p == 'fromDate') {
                    $scope.fromDate = '';
                } else {
                    $scope.toDate = '';
                }
            }
        } else {
            if ($scope.fromDate == '' && $scope.toDate == '') {
                // $scope.getChemicalCost();
            }
        }
    };
    $scope.parsePriceReportArr = (v) => {
        let newArr = [];
        if (v && (typeof v === 'object')) {            
            Object.keys(v).map((key)=>{
                newArr.push(v[key])
            })
        }
        return newArr
    }
    $scope.isChemicalReportProcessing = false;
    $scope.getChemicalCost = function(type='') {        
        $scope.isChemicalReportProcessing = true;
        $scope.seriesDataSpent = [];
        $scope.seriesDataCharged = [];
        $scope.seriesDataUnsortedSpent = [];
        $scope.seriesDataUnsortedCharged = [];
        $scope.seriesDataCharged = [];
        var jobParam = {
            filterMonth:$scope.filterMonth
        };
        if ($scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        }
        let api_url = "/chemical_cost_price_report";       
        apiGateWay.get(api_url, jobParam).then(function(response) {
            if (response.data.status == 200) {               
                var jobCostResponse = response.data.data;
                var itemsArr = [];                
                $scope.activeCustomers = jobCostResponse.activeCustomers ? jobCostResponse.activeCustomers : 0;
                $scope.jobsCompleted = jobCostResponse.jobsCompleted ? jobCostResponse.jobsCompleted : 0;
                $scope.propertyServiced = jobCostResponse.propertyServiced ? jobCostResponse.propertyServiced : 0;        
                itemsArr = $scope.parsePriceReportArr(jobCostResponse.piePriceData);
                $scope.totalChemicalCountsSpent = jobCostResponse.totalChemicalCost && jobCostResponse.totalChemicalCost != 'None' ? jobCostResponse.totalChemicalCost : 0;
                $scope.totalChemicalCountsCharged = jobCostResponse.totalChemicalPrice && jobCostResponse.totalChemicalPrice != 'None' ? jobCostResponse.totalChemicalPrice : 0;                
                itemsArr.forEach(function(item){ 
                    $scope.seriesDataUnsortedSpent.push({name:item.keyValue, y:item.cost})                   
                    $scope.seriesDataUnsortedCharged.push({name:item.keyValue, y:item.price})                                       
                });  
                if($scope.seriesDataUnsortedSpent.length > 0){
                    $scope.seriesDataSpent = $scope.seriesDataUnsortedSpent.sort(function (a,b){return a.y - b.y;})
                }
                if($scope.seriesDataUnsortedCharged.length > 0){
                    $scope.seriesDataCharged = $scope.seriesDataUnsortedCharged.sort(function (a,b){return a.y - b.y;})
                }
            }
            $timeout(function() {                   
                $scope.generateChart();   
                $scope.isChemicalReportProcessing = false;
            }, 1000);
            
        },function(error){
            $scope.isChemicalReportProcessing = false;
        });
    };
    $scope.reloadPage = function(){
        $window.location.reload();
    }    
    $scope.downloadJobReport = function() {        
        var jobParam = {
            filterMonth: $scope.filterMonth
        };
        if ($scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        } 
        var reportApiURL = "/download_job_report";       
        $scope.isDownloadingReoprt = true;
        apiGateWay.get(reportApiURL, jobParam).then(function(response) {
            if (response.data.status == 200) {
                $window.location.href = response.data.data.file_url;
            } 
            $scope.isDownloadingReoprt = false;
        }, function(error){
            $scope.isDownloadingReoprt = false;
        });       
    };
    $scope.downloadChemicalReport = function() {
        if(!$scope.checkCustomDates($scope.filterMonth, $scope.fromDate, 'fromDateInput', $scope.toDate, 'toDateInput')) {
            return false
        }
        var jobParam = {
            filterMonth:$scope.filterMonth
        };
        if ($scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        }
        let reportApiURL = '';
        if ($scope.reportMode === 'spent') {
            reportApiURL = "/download_chemical_report"
            $scope.viewReportStyleType(jobParam, reportApiURL);            
        } 
        if ($scope.reportMode === 'charged') {
            reportApiURL = "/download_chemical_price_report"
            $scope.showEmailInvoiceOpenPopup(jobParam, reportApiURL);
        }         
    };
    $scope.generateChart = function(){
        var isChartDivExist = document.getElementById('REPORTCHART');
        if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
            return
        }
        Highcharts.chart('REPORTCHART', {
			chart:{
                type:'pie',
                height: 200,
                width: 550
            },
            exporting: { enabled: false },
            credits: { enabled: false },
            colors: ['#7cb5ec', '#91E8E0', '#F45C5B', '#2C9090', '#E6D159', '#F45985', '#7F85E3', '#DAAC98'],
            title: { text: null },           
			plotOptions: {              
                pie: {
                    point: {
                        events: {
                            legendItemClick: function(){
                                return false;
                            }
                        }
                    },
                    allowPointSelect: false,
                    cursor: 'pointer',
                    showInLegend: true,
                    dataLabels: {
                        enabled: false,                       
                        
                    },
                    size: 180 									
                }
            },
            tooltip: {
                pointFormat: '{point.percentage:.1f}%',                
                useHTML: true,
                style: {
                    padding: 0,
                    backgroundColor: '#000',
                    borderColor: 'black',
                    fontSize: '12px',
                },
                borderRadius: 0,
                borderWidth: 0,
                formatter: function(){
                  return '<b>'+this.point.name+'</b> <br />'+this.point.percentage.toFixed(2)+'% <br />'+$filter('currency')(this.point.y);
                }
            },
            legend: {
                enabled: true,
                layout: 'vertical',
                align: 'right',
                width: 300,
                verticalAlign: 'middle',
                useHTML: true,
                symbolHeight:15,
                symbolRadius: 2,
                reversed:true,
                labelFormatter: function() {
                    return '<div class="custom-legend"><span class="bullet" style="background-color:'+this.color+';"></span><div class="key">' + this.name + '</div><div class="amount">' + $filter('currency')(this.y) + '</div></div>';
                },               
            },
			series: [{
				type: 'pie',                
				data: $scope.reportMode == 'spent' ? $scope.seriesDataSpent : $scope.seriesDataCharged
                
			}]
		}/*, function(chart) {
            var options = chart.options.legend;
             function clickItem(series, $legendItem, $line) {
              series.setVisible();
              $legendItem.css(
                options[series.visible ? 'itemStyle' : 'itemHiddenStyle']
              );
              $line.css({
                borderTop: '2px solid ' + (series.visible ? series.color :
                  options.itemHiddenStyle.color)
              });
            }
            // Create the legend box
            var $legend = $('<div>')
              .css({
                width: 300,
                maxHeight: 100,
                padding: 10,
                position: 'absolute',
                overflow: 'hidden',
                overflowY:'auto',
                right: 10,
                top: 40,
                borderColor: options.borderColor,
                borderWidth: options.borderWidth,
                borderStyle: 'solid',
                borderRadius: options.borderRadius
              })
              .appendTo(chart.container);
          
          
            $.each(chart.series, function(i, series) {
                var $legendItem = '';
                $.each(chart.series[0].userOptions.data, function(i, data) {
                    $legendItem += $('<div>')
                .css({
                  position: 'relative',
                  marginLeft: 20
                })
                .css(options[series.visible ? 'itemStyle' : 'itemHiddenStyle'])
                .html('<div style="width:270px; font-size:16px; font-weight:normal; line-height: 1.3;"><div style="text-align: left; float:left; ">' + data[0] + '</div><div style=" float:right;text-align:right;">$' + data[1]  + '</div></div>')
                .appendTo($legend);
                })
              
             
          
              // click handler 
              
          
            });
          }*/
          );
          
    }
    $scope.generateChart();
    // email popup feature
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;    
    $scope.reportPageSelectedReportParams = {};
    $scope.reportPageIsReportSending = false;
    $scope.reportPagereportGeneratingProcessStart = false;
    $scope.reportPageSentReportEmailModel = {
        email: ''
    }
    $scope.reportPageErrorMsg = '';
    $scope.sendReport = function() {
        $scope.reportPageIsReportSending = true;
        var reportURL = $scope.reportPageSelectedReportParams.reportApiURL;
        var sendReportParams = {
            email: $scope.reportPageSentReportEmailModel.email,
            reportType: '',
        }
        if (reportURL === '/download_chemical_report') {
            sendReportParams.reportType = 'chemicalCost'
        }
        if (reportURL === '/simplified_chemical_cost_report') {
            sendReportParams.reportType = 'simplified_chemical_cost_report'
        }
        if (reportURL === '/download_chemical_price_report') {
            sendReportParams.reportType = 'chemicalPrice'
        }
        if (reportURL === '/company_tech_pay_report') {
            sendReportParams.reportType = 'companyTechPay'
        }
        if (reportURL === '/tech_pay_report') {
            sendReportParams.reportType = 'techPay'
        }
        if (reportURL === '/download_tech_job_tracking_report') {
            sendReportParams.reportType = 'technicianTime'
        }
        if (reportURL === '/profit_breakdown_download') {
            sendReportParams.reportType = 'profitBreakdown'
        }
        if (reportURL === '/company_tech_feedback_report') {
            sendReportParams.reportType = 'companyFeedbackReport'
        } 
               
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.reportPagereportGeneratingProcessStart = true;
                var params = $scope.reportPageSelectedReportParams.jobParam;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
                setTimeout(function(){
                    $scope.reportPagereportGeneratingProcessStart = false;
                    $scope.reportPageIsReportSending = false;                       
                    ngDialog.closeAll();
                }, 2000)
            } else {
                $scope.reportPageErrorMsg = 'Some error occured. Please try again.';
                setTimeout(function(){
                    $scope.reportPageErrorMsg = '';
                }, 2000)
            }                     
        }, function(error){
            $scope.reportPageErrorMsg = typeof error == 'string' ? error : 'Something went wrong.';
            setTimeout(function(){
                $scope.reportPageErrorMsg = '';
            }, 2000)
            $scope.reportPageIsReportSending = false;
        });
    }
    $scope.generateReportByReportId = function(params) {        
        apiGateWay.get($scope.reportPageSelectedReportParams.reportApiURL, params).then(function(response) {
            // Report will be sent
        }, function(error){
        });
    }
    $scope.checkCustomDates = function(filterMonth, startDate, startDateId, endDate, endDateId) {
        if(filterMonth == 'custom') {
            if (!startDate || startDate == '') {
                $('#' + startDateId).focus()
                return false
            }
            if (!endDate || endDate == '') {
                $('#' + endDateId).focus()
                return false
            }
        }
        return true
    }
    // email popup feature
    $scope.showEmailInvoiceOpenPopup = function(jobParam, reportApiURL){
        $scope.closeReportStyleType();
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.reportPageSelectedReportParams.jobParam = jobParam;  
        $scope.reportPageSelectedReportParams.reportApiURL = reportApiURL;  
        $scope.showEmailInvoiceOpenPopupModal = ngDialog.open({
            template: 'sentReportEmailPopupReportPage.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {                
            }
            });
        }
    $scope.sentReportEmailPopupReportPageStyle = '';
    $scope.viewReportStyleType = function(jobParam, reportApiURL) {
        $scope.cacheReportStyleJobParam = jobParam;
        $scope.cacheReportStyleReportApiURL = reportApiURL;
        $scope.sentReportEmailPopupReportPageStyle = ngDialog.open({
            template: 'sentReportEmailPopupReportPageStyle.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.reportPageSelectedReportParams = {};
                $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
                $scope.reportPagereportGeneratingProcessStart = false;
                $scope.reportPageIsReportSending = false;
            }
            });     
    }
    $scope.selectReportStyleType = function(type='group') {
        var jobParam = $scope.cacheReportStyleJobParam;
        var reportApiURL = $scope.cacheReportStyleReportApiURL;  
        if (type === 'group') {
            reportApiURL = '/download_chemical_report';
        }
        if (type === 'single') {
            reportApiURL = '/simplified_chemical_cost_report';
        }
        $scope.showEmailInvoiceOpenPopup(jobParam, reportApiURL);
    }
    $scope.closeReportStyleType = function() {
        if ($scope.sentReportEmailPopupReportPageStyle) {
            $scope.sentReportEmailPopupReportPageStyle.close();
        }
    }
    $scope.getFeedbackReport = () => {
        let feedbackPayload = {
            startDate: null,
            endDate: null
        };
        if ($scope.filterMonthFb == 'custom' && $scope.pageObjFb.fromDate != '' && $scope.pageObjFb.toDate != '') {
            feedbackPayload = {
                startDate: $filter('date')(new Date($scope.pageObjFb.fromDate), 'yyyy-MM-dd'),
                endDate: $filter('date')(new Date($scope.pageObjFb.toDate), 'yyyy-MM-dd')
            }
        } else if ($scope.pageObjFb.month && $scope.pageObjFb.month != '') {
            let rowEndDate = moment($scope.pageObjFb.month).add(1, 'months').toDate();
            rowEndDate = moment(rowEndDate).subtract(1, 'days').toDate();
            feedbackPayload = {
                startDate: $filter('date')(new Date($scope.pageObjFb.month), 'yyyy-MM-dd'),
                endDate: $filter('date')(new Date(rowEndDate), 'yyyy-MM-dd')
            }
        }
        $scope.isProcessingFeedback = true;
        apiGateWay.get('/customers_tech_feedback_count', feedbackPayload).then(function(response) {
            if (response.data.status == 200) {
                $scope.feedbackData = response.data.data;
                $scope.feedbackList = $scope.feedbackData.techniciansRatings;
                if (Number($scope.feedbackData.ratingCount.up) > 0 && Number($scope.feedbackData.ratingCount.down) > 0) {
                    $rootScope.hasFeedback = true;                      
                  }
                  if (Number($scope.feedbackData.ratingCount.up) > 0 && Number($scope.feedbackData.ratingCount.down) == 0) {
                    $rootScope.hasFeedback = true;
                  }
                  if (Number($scope.feedbackData.ratingCount.up) == 0 && Number($scope.feedbackData.ratingCount.down) > 0) {
                    $rootScope.hasFeedback = true;
                  }
                  if (Number($scope.feedbackData.ratingCount.up) == 0 && Number($scope.feedbackData.ratingCount.down) == 0) {
                    $rootScope.hasFeedback = false;
                  }
                  if ($rootScope.hasFeedback) {
                    $scope.generateFeedbackChart();
                  } else {
                    document.getElementById("COMPANYFEEDBACKCHART").innerHTML = null;
                  }
            } else {
                $scope.reportPageErrorMsg = 'Some error occured. Please try again.';
                setTimeout(function(){
                    $scope.reportPageErrorMsg = '';
                }, 2000)
            }
            $scope.isProcessingFeedback = false;                     
        }, function(error){
            $scope.isProcessingFeedback = false;
        });
    }
    $scope.downloadFeedbackReport = function() {
        if(!$scope.checkCustomDates($scope.filterMonthFb, $scope.pageObjFb.fromDate, 'fromDateInputFeedback', $scope.pageObjFb.toDate, 'toDateInputFeedback')) {
            return false
        }
        var jobParam = {
            startDate: null,
            endDate: null
        };
        
        if ($scope.filterMonthFb == 'custom' && $scope.pageObjFb.fromDate != '' && $scope.pageObjFb.toDate != '') {
            jobParam = {
                startDate: $filter('date')(new Date($scope.pageObjFb.fromDate), 'yyyy-MM-dd'),
                endDate: $filter('date')(new Date($scope.pageObjFb.toDate), 'yyyy-MM-dd')
            }
        } else if ($scope.pageObjFb.month && $scope.pageObjFb.month != '') {
            let rowEndDate = moment($scope.pageObjFb.month).add(1, 'months').toDate();
            rowEndDate = moment(rowEndDate).subtract(1, 'days').toDate();
            jobParam = {
                startDate: $filter('date')(new Date($scope.pageObjFb.month), 'yyyy-MM-dd'),
                endDate: $filter('date')(new Date(rowEndDate), 'yyyy-MM-dd')
            }
        }
        let reportApiURL =  "/company_tech_feedback_report"
        $scope.showEmailPopupFeedback(jobParam, reportApiURL);       
    };
    
    $scope.showEmailPopupFeedback = function(jobParam, reportApiURL){
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.reportPageSelectedReportParams.jobParam = jobParam;  
        $scope.reportPageSelectedReportParams.reportApiURL = reportApiURL;  
        ngDialog.open({
            template: 'sentReportEmailPopupFeedback.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.reportPageSelectedReportParams = {};
                $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
                $scope.reportPagereportGeneratingProcessStart = false;
                $scope.reportPageIsReportSending = false;
            }
            });
    }
    
    $scope.generateFeedbackChart = () => {
      var isChartDivExist = document.getElementById("COMPANYFEEDBACKCHART");
      if (isChartDivExist === null ||  isChartDivExist === undefined ||  !isChartDivExist ) {
        return;
      }
      Highcharts.chart("COMPANYFEEDBACKCHART", {
        colors: ["#bc1010", "#0cad14"],
        chart: {
          plotBackgroundColor: null,
          plotBackgroundImage: null,
          plotBorderWidth: 0,
          plotShadow: false,
          height: 180,
          style: {
            fontFamily: "Lato",
          },
          type: "pie",
        },
        exporting: { enabled: false },
        credits: { enabled: false },
        title: {
          text: "<b>" + Number($scope.pParcentage(Number($scope.feedbackData.ratingCount.up), Number($scope.feedbackData.ratingCount.down))) + "%</b>",
          align: "center",
          verticalAlign: "middle",
          x: 1,
          y: 9,
          style: {
            fontSize: '22px' 
         }
        },
        tooltip: {
            headerFormat: "",
            formatter: function() {
                var percentage = this.point.percentage;
                if (percentage === Math.floor(percentage)) {
                  return '<b>'+Number(percentage.toFixed(0))+'% '+this.point.name+'</b><br/><b>'+this.point.y+' total</b>';
                } else {
                  return '<b>'+Number(percentage.toFixed(2))+'% '+this.point.name+'</b><br/><b>'+this.point.y+' total</b>'; 
                }
              },
        },
        plotOptions: {
          pie: {
            allowPointSelect: false,
            cursor: "pointer",
            dataLabels: {
              enabled: false,
              format: "{point.name}: {y} %",
            },
            showInLegend: false,
          },
        },
        series: [
          {
            name: "Company Feedback",
            colorByPoint: true,
            innerSize: "70%",
            data: [
              {
                name: "Negative Feedback",
                y: Number($scope.feedbackData.ratingCount.down),
              },
              {
                name: "Positive Feedback",
                y: Number($scope.feedbackData.ratingCount.up),
              },
            ],
          },
        ],
      });
    };
    $scope.changeMonth = (direction) => {
        if(direction == 'next'){
            $scope.pageObj.month = moment($scope.pageObj.month).add(1, 'months').toDate();
        } else {
            $scope.pageObj.month = moment($scope.pageObj.month).subtract(1, 'months').toDate();
        }
        $scope.getFeedbackReport();
    }
    $scope.changeMonthFb = (direction) => {
        if(direction == 'next'){
            $scope.pageObjFb.month = moment($scope.pageObjFb.month).add(1, 'months').toDate();
        } else {
            $scope.pageObjFb.month = moment($scope.pageObjFb.month).subtract(1, 'months').toDate();
        }
        $scope.getFeedbackReport();
    }
    $scope.filterByDateFb = function(val, name) {
        if ($scope.pageObjFb.fromDate != '' && $scope.pageObjFb.toDate != '') {
            var fromDate = new Date($scope.pageObjFb.fromDate)
            var toDate = new Date($scope.pageObjFb.toDate);
            if (fromDate <= toDate) {
                $scope.filterMonthFb = 'custom';        
                $scope.getFeedbackReport();
            }
        } else {
        }
    };
    $scope.pParcentage = (a, b) => {
        return  (Math.abs((a*100)/(a+b))).toFixed(2);
    }
    $scope.getPercentage = (up, down) => {
        up = Number(up)
        down = Number(down) 
        return Number((Math.abs((up*100)/(up+down))).toFixed(2))
    }
});