angular.module('POOLAGENCY')

.controller('profitReportController', function($scope, $timeout, $rootScope, $filter, apiGateWay, auth,$window, ngDialog) {
    $scope.canView = false;
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
        column: 'profitPercentage',
        fromDate: '',
        toDate: '',
        lowProfitPercentage: 40,
        profitFilter: ['profitable', 'lowprofit', 'losingmoney'],
        month: moment(new Date()).subtract(1, 'months').toDate(),
        filterReportData: ['Month','custom'],
        filterMonth: 'Month'
    }   
    $scope.isProcessing = false;
    $scope.profitReportObj = {
        "averageProfit": 0,
        "costTotal": 0,
        "invTotal": 0,
        "losingMoney": 0,
        "lowProfit": 0,
        "profitTotal": 0,
        "profitable": 0,
        "totCount": 0,
        "list":[],
        "lowprofitpercentage":40
    }; 
    $scope.model = {
        lowProfit:40
    }


    $scope.filterByDays = function(){
        $scope.pageObj.currentPage = 1;
        $scope.pageObj.fromDate = "";
        $scope.pageObj.toDate = "";
        if($scope.pageObj.filterMonth!='custom'){
            $scope.getProfitReport();
        }
        
        else{
            $timeout(function() {
                angular.element(document.getElementById('fromDateInputProfit')).focus();
            });
            
        }
    }    
    $scope.$on("$includeContentLoaded", function(){
        $(document).ready(function() {
            $('.input-daterange-include').datepicker({
                autoclose: true,
                endDate: moment().format('M/DD/YYYY'),
                todayBtn: "linked"
            });
        });
    });
    $scope.pageObj.fromDate = "";
    $scope.pageObj.toDate = "";
    
    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.filterByDate = function(p) {
        if ($scope.pageObj.fromDate != '' && $scope.pageObj.toDate != '') {
            var fromDate = new Date($scope.pageObj.fromDate)
            var toDate = new Date($scope.pageObj.toDate);
            if (fromDate <= toDate) {
                $scope.pageObj.currentPage = 1;
                $scope.pageObj.filterMonth = 'custom';               
                $scope.getProfitReport();
            } else {
                if (p == 'fromDate') {
                    $scope.pageObj.fromDate = '';
                } else {
                    $scope.pageObj.toDate = '';
                }
            }
        } else {
            if ($scope.pageObj.fromDate == '' && $scope.pageObj.toDate == '') {
                $scope.pageObj.currentPage = 1;
                $scope.getProfitReport();
            }
        }
    };
    $scope.changeMonth = (direction) => {
        if(direction == 'next'){
            $scope.pageObj.month = moment($scope.pageObj.month).add(1, 'months').toDate();
        } else {
            $scope.pageObj.month = moment($scope.pageObj.month).subtract(1, 'months').toDate();
        }
        $scope.getProfitReport();
    }
    $scope.isProcessingProfitBreakdownReport = false;
    $scope.isProcessingProfitBreakdownReportList = false;
    $scope.getProfitReport = (listOnly=false) => {
        let postData = {
            page: $scope.pageObj.currentPage - 1,
            length: $scope.pageObj.limit,
            dir: $scope.pageObj.dir,
            column: $scope.pageObj.column,           
            profitFilter: $scope.pageObj.profitFilter.join(','),
            lowProfitPercentage: ''
        };       
        if( $scope.pageObj.lowProfitPercentage != $scope.profitReportObj.lowprofitpercentage){
            postData.lowProfitPercentage = $scope.pageObj.lowProfitPercentage;
        }
        $scope.pageObj.page = $scope.pageObj.currentPage
        if ($scope.pageObj.fromDate != '' && $scope.pageObj.toDate != '') {
            postData.startDate = $filter('date')(new Date($scope.pageObj.fromDate), 'yyyy-MM-dd');
            postData.endDate = $filter('date')(new Date($scope.pageObj.toDate), 'yyyy-MM-dd');
        }
        if($scope.pageObj.filterMonth != 'custom'){
            const startOfMonth = moment($scope.pageObj.month).clone().startOf('month').format('YYYY-MM-DD');
            const endOfMonth   = moment($scope.pageObj.month).clone().endOf('month').format('YYYY-MM-DD');
            postData.startDate = $filter('date')(moment(startOfMonth).toDate(), 'yyyy-MM-dd');
            postData.endDate = $filter('date')(moment(endOfMonth).toDate(), 'yyyy-MM-dd');
        }
        if (!listOnly) {   
            $scope.isProcessingProfitBreakdownReport = true;          
            apiGateWay.get('/profit_breakdown', postData).then(function(response) {
                if (response.data.status == 200) {
                    $scope.profitReportObj.averageProfitAmount = response.data.data.averageProfitAmount;
                    $scope.profitReportObj.averageProfitPercentage = response.data.data.averageProfitPercentage;
                    $scope.profitReportObj.costTotal = response.data.data.costTotal;
                    $scope.profitReportObj.invTotal = response.data.data.invTotal;
                    $scope.profitReportObj.losingMoney = response.data.data.losingMoney;
                    $scope.profitReportObj.lowProfit = response.data.data.lowProfit;
                    $scope.profitReportObj.lowprofitpercentage = response.data.data.lowprofitpercentage;
                    $scope.profitReportObj.profitTotal = response.data.data.profitTotal;
                    $scope.profitReportObj.profitable = response.data.data.profitable;                                      
                    $scope.pageObj.lowProfitPercentage = $scope.model.lowProfit = $scope.profitReportObj.lowprofitpercentage ? parseFloat($scope.profitReportObj.lowprofitpercentage) : '' ;
                    $scope.activePropertySeries = [
                        { name:'Profitable', slug:'profitable', y:$scope.profitReportObj.profitable },
                        { name:'Low profit', slug:'lowprofit', y:$scope.profitReportObj.lowProfit },
                        { name:'Losing money', slug:'losingmoney', y:$scope.profitReportObj.losingMoney },
                    ]  
                    $scope.generateChart();  
                    $scope.generateAverageProfitChart();
                } else {                    
                    $scope.activePropertySeries = [];
                }            
                $scope.isProcessingProfitBreakdownReport = false;
            },function(error){
                $scope.activePropertySeries = [];
                $scope.isProcessingProfitBreakdownReport = false;
            }); 
        }
        $scope.isProcessingProfitBreakdownReportList = true;
        apiGateWay.get('/profit_breakdown_list', postData).then(function(response) {
            if (response.data.status == 200) {
                $scope.profitReportObj.list = response.data.data.list || []; 
                $scope.profitReportObj.totCount = response.data.data.totCount;                 
                $scope.pageObj.totalRecord = $scope.profitReportObj.totCount;
                $scope.pageObj.totalPage = ($scope.pageObj.totalRecord % $scope.pageObj.limit) !== 0 ? parseInt($scope.pageObj.totalRecord / $scope.pageObj.limit) : parseInt(($scope.pageObj.totalRecord / $scope.pageObj.limit)) - 1;
            } else {
                $scope.profitReportObj.list = [];
                $scope.profitReportObj.totCount = 0;
                $scope.pageObj.totalPage =  $scope.pageObj.totalRecord = 0;
            }            
            $scope.isProcessingProfitBreakdownReportList = false;
        },function(error){
            $scope.profitReportObj.list = [];
            $scope.profitReportObj.totCount = 0;
            $scope.pageObj.totalPage =  $scope.pageObj.totalRecord = 0;
            $scope.isProcessingProfitBreakdownReportList = false;
        });
    } 
    $scope.goToListPage = (page) => {
        $scope.pageObj.currentPage = page;
        $scope.getProfitReport(true);
    };
    $scope.orderByJobList = (column) => {
        $scope.pageObj.column = column;
        $scope.pageObj.dir = ($scope.pageObj.dir == 'desc') ? 'asc' : 'desc';
        $scope.getProfitReport(true);
    };
    $scope.lowProfitUpdate = (value) => {
        if(value && value != $scope.pageObj.lowProfitPercentage){           
            $scope.pageObj.lowProfitPercentage = value;
            $scope.getProfitReport();
        }   
    }
    $scope.lowProfitUpdateByEnter = function(e, value){   
        if (e.keyCode == 13) {
            $scope.lowProfitUpdate(value)
        }
    }
    $scope.filterByProfit = (value, type='') => {
       
        if(value && $scope.pageObj.profitFilter.indexOf(value) == -1){
            $scope.pageObj.currentPage = 1;
            $scope.pageObj.profitFilter.push(value);
            $scope.getProfitReport();
        } else {
            $scope.pageObj.currentPage = 1;           
            $scope.pageObj.profitFilter.splice($scope.pageObj.profitFilter.indexOf(value), 1);   
            $scope.getProfitReport();
        }
        /*if(type == 'reset'){
            $scope.pageObj.currentPage = 1;
            $scope.pageObj.profitFilter = ['profitable', 'lowprofit', 'losingmoney']
            $scope.getProfitReport();
        }*/
          
    }

    $scope.downloadProfitBreakdownReport = function(type='') {
        if(!$scope.checkCustomDates($scope.pageObj.filterMonth, $scope.pageObj.fromDate, 'fromDateInputProfit', $scope.pageObj.toDate, 'toDateInputProfit')) {
            return false
        }
        let postData = {
            page: $scope.pageObj.currentPage - 1,
            length: $scope.pageObj.limit,
            dir: $scope.pageObj.dir,
            column: $scope.pageObj.column,           
            profitFilter: $scope.pageObj.profitFilter.join(','),
            lowProfitPercentage: ''
        };       
        if( $scope.pageObj.lowProfitPercentage != $scope.profitReportObj.lowprofitpercentage){
            postData.lowProfitPercentage = $scope.pageObj.lowProfitPercentage;
        }
        $scope.pageObj.page = $scope.pageObj.currentPage
        if ($scope.pageObj.fromDate != '' && $scope.pageObj.toDate != '') {
            postData.startDate = $filter('date')(new Date($scope.pageObj.fromDate), 'yyyy-MM-dd');
            postData.endDate = $filter('date')(new Date($scope.pageObj.toDate), 'yyyy-MM-dd');
        }
        if($scope.pageObj.filterMonth != 'custom'){
            const startOfMonth = moment($scope.pageObj.month).clone().startOf('month').format('YYYY-MM-DD');
            const endOfMonth   = moment($scope.pageObj.month).clone().endOf('month').format('YYYY-MM-DD');
            postData.startDate = $filter('date')(new Date(startOfMonth), 'yyyy-MM-dd');
            postData.endDate = $filter('date')(new Date(endOfMonth), 'yyyy-MM-dd');
        }
        var reportApiURL = "/profit_breakdown_download";        
        postData.length = $scope.pageObj.totalRecord;         
        $scope.showEmailInvoiceOpenPopup(postData, reportApiURL);      
    };

    $scope.generateChart = () => {
        Highcharts.wrap(Highcharts.seriesTypes.pie.prototype, 'render', function (proceed) {
            proceed.call(this);
            
            if (!this.circle) {
                this.circle = this.chart.renderer.circle(0, 0, 0).add(this.group);
            }
            if (this.total === 0) {
                this.circle.attr({
                    cx: this.center[0],
                    cy: this.center[1],
                    r: this.center[2] / 2,
                    fill: 'none',
                    stroke: 'silver',
                    'stroke-width': 1
                });
            } else {
                this.circle.attr({
                    'stroke-width': 0
                });
            }
        });
        var isChartDivExist = document.getElementById('ACTIVEPROPERTYCHART');
        if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
            return
        }
        Highcharts.chart('ACTIVEPROPERTYCHART', {
			chart:{
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type:'pie',
                height: 200,
                style: {
                    fontFamily: 'Lato'
                }
            },
            exporting: { enabled: false },
            credits: { enabled: false },
            colors: ['#46C150', '#FFB548', '#FD0000',],
            title: { text: null },           
			plotOptions: {              
                pie: {
                    point: {
                        events: {
                            legendItemClick: function(e){                                
                                $scope.filterByProfit(e.target.slug);      
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
                    size: 180,
                    center: [70,70],									
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
                  return '<b>'+this.point.name+'</b> <br />'+this.point.percentage.toFixed(2)+'% <br />'+this.point.y;
                }
            },
            legend: {
                enabled: true,
                layout: 'vertical',
                align: 'right',
                width: 500,
                verticalAlign: 'middle',
                useHTML: true,
                symbolHeight: 15,
                symbolRadius: 2,
                reversed: false,  
                labelFormatter: function() { 
                    
                    let content = '';            
                    content += '<div class="custom-legend '+($scope.pageObj.profitFilter.length > 0 && $scope.pageObj.profitFilter.indexOf(this.slug) > -1 ? 'bb' :'')+'">';  
                    content += '<span class="bullet" style="background-color:'+this.color+';"></span>';
                    content += '<div class="key">'+this.name+'</div>';  
                    //let anchor = $compile('<a class="underline-none" style="color:#333;" ng-click="filterByProfit('+this.slug+')">'+this.name+'</a>')($scope)  
                    /*content += $scope.pageObj.profitFilter == this.slug ? 
                                    '<div class="key">'+this.name+'</div>' : 
                                        '<div class="key"><a class="underline-none" style="color:#333;" ng-click="filterByProfit('+this.slug+')">'+this.name+'</a></div>'; */                           
                    content += '<div class="detail">'                              
                    content += '<div>'+(this.y ? this.y : '0')+'</div>';                    
                    content += '</div>'                        
                    content += '</div>';
                    return content
                },               
            },
			series: [{
				type: 'pie',                
				data: $scope.activePropertySeries
                
			}]
		});
          
    }
    $scope.generateAverageProfitChart = () => {
        var isChartDivExist = document.getElementById('AVERAGEPROFITCHART');
        if (isChartDivExist === null || isChartDivExist === undefined || !isChartDivExist) {
            return
        }
       Highcharts.chart('AVERAGEPROFITCHART', {
            chart: {
                plotBackgroundColor: null,
                plotBackgroundImage: null,
                plotBorderWidth: 0,
                plotShadow: false,
                height:320,
                style: {
                    fontFamily: 'Lato'
                }
            },
            exporting: { enabled: false },
            credits: { enabled: false },
            title: {
                text: null
            },
            tooltip: {
                enabled: false
            },
            pane: {
                startAngle: -90,
                endAngle: 90,               
                background: {
                    backgroundColor: '#B3B3B3',
                    borderWidth: 0,
                    shape: 'arc',
                    innerRadius: '70%',
                    outerRadius: '100%',
                    color:'#fff',
                }
            },
            yAxis: [{
                stops: [
                    [1, '#FF9955'] // red
                    ],
                min: 0,
                max: 100,
                minorTickLength: 0,
                lineWidth: 0,
                tickPixelInterval: 10,
                tickWidth: 1,
                tickPosition: 'inside',
                tickLength: 10,
                tickColor: '#fff',
                tickPositions: [25, 50, 75],
                color:'#fff',  
                labels: {
                    distance: -22,
                    color:'#fff',
                    formatter: function() {
                        return '<span style="color:#fff">'+this.value+'%</span>';
                    },                   
                }
            }, {
                linkedTo: 0,
                lineWidth: 0,
                minorTickLength: 0,
                tickPositions: [$scope.calculatePercentageForGraph($scope.profitReportObj.averageProfitPercentage)],
                tickLength: 0,
                labels: {
                  x: 20,
                  y: -40,
                  style: {
                    fontSize: '20px'
                  },
                  formatter: function() {
                    return $scope.profitReportObj.averageProfitPercentage ? '<span style="font-size:18px; color:#000">'+$scope.profitReportObj.averageProfitPercentage+'%</span>' : '';
                  },
                }
            }],
            series: [{
                type: 'gauge',
                data: [ $scope.calculatePercentageForGraph($scope.profitReportObj.averageProfitPercentage)],
                pivot: {
                    radius: 0
                },
                dataLabels: {
                    formatter: function() {
                        return $filter('currency')($scope.profitReportObj.averageProfitAmount ? $scope.profitReportObj.averageProfitAmount : 0);
                    },
                    y: -5,
                    borderWidth: 0,
                    style: {
                        fontSize: '20px'
                    }
                },
                dial: {
                    radius: '110%',
                    backgroundColor: '#46C150',
                    borderWidth: 0,
                    baseWidth: 3,
                    topWidth: 3,
                    baseLength: '100%', // of radius
                    rearLength: '0%'
                }
            }, 
            {
                type: 'solidgauge',
                fillColor: '#FF9955',
                data: [$scope.pageObj.lowProfitPercentage],
                innerRadius: '70%',
                outerRadius: '100%',
                tickPixelInterval: 10,
                tickWidth: 1,
                tickPosition: 'inside',
                tickLength: 10,
                tickColor: '#fff',
                tickPositions: [25, 50, 75],
            }]
    
        })  
    }
    $scope.calculatePercentageForGraph = (value)=>{        
        if(value){            
            return (value > -1 ? (value > 100 ? 100 : value) : 0)
        } else {
            return 0;
        }
       
    }
    // email popup feature
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail; 
    $scope.reportPageSelectedReportParams = {};
    $scope.reportPageIsReportSending = false;
    $scope.reportPagereportGeneratingProcessStart = false;
    $scope.reportPageSentReportEmailModel = {
        email: ''
    }
    $scope.showEmailInvoiceOpenPopup = function(jobParam, reportApiURL){
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.reportPageSelectedReportParams.jobParam = jobParam;  
        $scope.reportPageSelectedReportParams.reportApiURL = reportApiURL;  
        ngDialog.open({
            template: 'sentReportEmailPopupProfitReport.html',
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
    $scope.reportPageErrorMsg = '';
    $scope.sendReport = function() {
        $scope.reportPageIsReportSending = true;
        var reportURL = $scope.reportPageSelectedReportParams.reportApiURL;
        var sendReportParams = {
            email: $scope.reportPageSentReportEmailModel.email,
            reportType: ''
        }
        if (reportURL === '/download_chemical_report') {
            sendReportParams.reportType = 'chemicalCost'
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
});
