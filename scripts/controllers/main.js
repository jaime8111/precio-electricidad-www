'use strict';

//var apiURL = '';
var apiURL = 'http://www.vissit.com/projects/precio-electricidad/';

angular.module('precioElectricidadAngularApp')
    .controller('MainCtrl', function ($scope, $http, $route) {
        $scope.online = true;

        //$scope.txt.months = array("Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre");
        var d = new Date();
        var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
        var days = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sábado"];

        $scope.txt = {
            title: 'Hello',
            todayString: days[d.getDay()],
            todayNumber: d.getUTCDate()
        };

        var currentMonth = parseInt(d.getUTCMonth()+1);

        /*
        if ( currentMonth < 10 ) {
            currentMonth = '0'+currentMonth;
        }
        */

        var todayDateURI = '/'+d.getFullYear()+'/'+currentMonth+'/'+d.getDate();
        var tomorrowDateURI = '/'+tomorrow.getFullYear()+'/'+parseInt(tomorrow.getUTCMonth()+1)+'/'+tomorrow.getDate();

        tabs($('.tabs'));
        $scope.today = {};
            $scope.today.availablePrices = false;
        $scope.tomorrow = {};
            $scope.tomorrow.availablePrices = false;

        $scope.refreshPage = function () {
            $route.reload();
        };

        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) {
                // The document is on focus
                // do our things.
                $scope.refreshPage();
              }
        }, false);
        $http({method: 'GET', url: apiURL + 'api/get'+todayDateURI}).
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available

                if ( !data.prices.length ) {
                    $scope.today.availablePrices = false;
                } else {
                    $scope.today.availablePrices = true;
                    $scope.today.dailyMin = data.prices[0].price;
                    $scope.today.dailyMax = 0;
                    $scope.today.averagePrice = 0;
                    $scope.today.chartPrices = [];
                    $scope.today.pastPrices = [];
                    $scope.today.currentHourPrice = [];

                    for(var i in data.prices) {
                        var price = parseFloat(data.prices[i].price);

                        $scope.today.chartPrices.push(price);

                        if (price < $scope.today.dailyMin) { $scope.today.dailyMin = price; }
                        if (price > $scope.today.dailyMax) { $scope.today.dailyMax = price; }
                        $scope.today.averagePrice += price;

                        if ( data.currentHour >= parseInt(data.prices[i].hour)) {
                            $scope.today.pastPrices.push(price);
                        }

                        if ( data.currentHour == parseInt(data.prices[i].hour)) {
                            $scope.today.currentHourPrice = price;
                        }
                    }

                    $scope.today.averagePrice = $scope.today.averagePrice / data.prices.length;

                    $scope.today.loaded = true;
                    //chart($('#chartContainer'), $scope.today.pastPrices, $scope.today.chartPrices, $scope.today.dailyMin);
                }


            }).
            error(function(data, status, headers, config) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
              $scope.online = false;
        });

        $http({method: 'GET', url: apiURL + 'api/get'+tomorrowDateURI}).
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available



                if ( !data.prices.length ) {
                    $scope.tomorrow.availablePrices = false;
                } else {
                    $scope.tomorrow.availablePrices = true;
                    $scope.tomorrow.dailyMin = data.prices[0].price;
                    $scope.tomorrow.dailyMax = 0;
                    $scope.tomorrow.averagePrice = 0;
                    $scope.tomorrow.chartPrices = [];
                    $scope.tomorrow.pastPrices = [];
                    $scope.tomorrow.currentHourPrice = [];

                    for(var i in data.prices) {
                        var price = parseFloat(data.prices[i].price);

                        $scope.tomorrow.chartPrices.push(price);

                        if (price < $scope.tomorrow.dailyMin) { $scope.tomorrow.dailyMin = price; }
                        if (price > $scope.tomorrow.dailyMax) { $scope.tomorrow.dailyMax = price; }
                        $scope.tomorrow.averagePrice += price;

                        if ( data.currentHour >= parseInt(data.prices[i].hour)) {
                            $scope.tomorrow.pastPrices.push(price);
                        }

                        if ( data.currentHour == parseInt(data.prices[i].hour)) {
                            $scope.tomorrow.currentHourPrice = price;
                        }
                    }

                    $scope.tomorrow.averagePrice = $scope.tomorrow.averagePrice / data.prices.length;
                    $scope.tomorrow.loaded = true;
                    //chart($('#chartTommorrowContainer'), $scope.tomorrow.pastPrices, $scope.tomorrow.chartPrices, $scope.tomorrow.dailyMin);
                }

            }).
            error(function(data, status, headers, config) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
        });
    }).directive('highchart', function () {
        var linker = function (scope, element, attr) {
            //scope.$watch('currentHourPrice', function() {
            //    scope.today.currentHourPrice = 8;
            //})

            scope.$watch('loaded', function() {
                //scope.$apply(function () {
                //    var d = new Date();
                //    var n = d.getSeconds();
                //    scope.currentHourPrice = n;
                //});

                $(window).resize();

                if ( !$(element).find('.highchart-chart-elem').length ) {
                    var highChartElem = angular.element('<div class="highchart-chart-elem"></div>'),
                        marketElem = angular.element('<div class="highchart-marker"></div>');
                    element.append(highChartElem);
                    element.append(marketElem);
                }

                //$compile(newDirective)($scope);

                $(element).find('.highchart-chart-elem').highcharts({
                    chart: {
                        events: {
                            click: function(e) {
                                var hour = Math.round(e.xAxis[0].value),
                                    price = scope.chartPrices[Math.round(e.xAxis[0].value)-1];

                                setMarker($(element), e.clientX);

                                // when hour is selected we need convert value
                                if ( typeof(price) === 'object' ) { price = price.y; }

                                scope.$apply(function () {
                                    scope.currentHourPrice = price;
                                });
                                $(element).parent().find('.currentPriceWrap p').html('Precio a las ' + hour + ':00');
                            }
                        },
                        backgroundColor: "transparent",
                        spacing: [0,0,0,0] // chart padding
                    },
                    title: {
                        text: ''
                    },
                    xAxis: {
                        tickWidth: 0,
                        lineWidth: 0,
                        labels: {
                            style: {
                                color: '#ffffff',
                                fontSize: 12
                            }
                        },
                        tickInterval: 2
                    },
                    yAxis: {
                        title: {
                            text: ''
                        },
                        gridLineWidth: 0,
                        labels: {
                            enabled: false
                        },
                        min: scope.minVal
                    },
                    tooltip: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        spline: {
                            lineWidth: 5,
                            color: "#ffffff",
                            marker: {
                                enabled: false
                            },
                            shadow: false,
                            allowPointSelect: true,
                            point: {
                                events: {
                                    click: function () {
                                        var hour = this.x,
                                            price = this.y;

                                        setMarker($(element), this.clientX);


                                        // when hour is selected we need convert value
                                        if ( typeof(price) === 'object' ) { price = price.y; }

                                        scope.$apply(function () {
                                            scope.currentHourPrice = price;
                                        });

                                        $(element).parent().find('.currentPriceWrap p').html('Precio a las ' + hour + ':00');
                                    }
                                }
                            },
                            states: {
                                hover: {
                                    lineWidth: 5
                                }
                            }
                        },
                        area: {
                            lineWidth: 0,
                            color: "#33B5E5",
                            fillOpacity: 1
                        }
                    },
                    series: [{
                        type: 'area',
                        pointInterval: 1,
                        pointStart: 1,
                        name: 'Precio',
                        data: scope.pastPrices
                      },{
                        type: 'spline',
                        pointInterval: 1,
                        pointStart: 1,
                        name: 'Precio',
                        data: scope.chartPrices
                    }]
                });

                // set market in current hour position
                if ( scope.pastPrices ) {
                    setMarker($(element), scope.pastPrices.length/24*parseInt($(window).width()));
                }
                $(window).resize();
            });
        }

        return {
            restrict:'A', // A: Atribute, E: Element
            scope: {
                chartPrices: "=hcChartPrices",
                pastPrices: "=hcPastPrices",
                minVal: "=hcMinVal",
                currentHourPrice: "=hcCurrentHourPrice",
                loaded: "=hcLoaded"
            },
            link: linker
        }
    });

$(window).resize(
    function () {
        setChartHeight($('.highchart-chart-elem'), 0.5);
    }
);
function setChartHeight(elems, ratio) {
    elems.each(function() {
        var elem = $(this);
        elem.height(elem.width() * ratio);
        elem.next('.highchart-marker').height((elem.width() * ratio)-15);
    });
    //$(window).resize();
}

function tabs(tabs) {
    tabs.each(function(i) {

        //Get all tabs
        var tab = $(this).find('a');
        tab.click(function(e) {
            var t = $(this);

            // Get Location of tab's content
            var contentLocation = t.attr("href")
            //contentLocation = contentLocation + "Tab";

            // Check if links start with hash symbol
            if(contentLocation.charAt(0)=="#") {
                e.preventDefault();

                // Make Tab Active
                tab.removeClass('active');
                t.addClass('active');

                // Show Tab Content
                $(contentLocation).parent('.tabs-content').children().hide();
                $(contentLocation).show();
                //setChartHeight($('.chartPanel'), 0.6);
                $(window).resize();
            }
        });
    });
}

function setMarker(elem, x) {
    x = parseInt(x);
    elem.find('.highchart-marker').css('left', x);
}