'use strict';

angular
  .module('precioElectricidadAngularApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute'
    //,'highcharts-ng'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/tomorrow', {
        templateUrl: 'views/about.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
