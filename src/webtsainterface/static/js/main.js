/**
 * Created by Juan on 6/4/14.
 */

requirejs.config({
    paths: {
        async: [
            '//cdnjs.cloudflare.com/ajax/libs/requirejs-async/0.1.1/async',
            'vendor/requirejs/async'
        ],
        jquery: [
            '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min',
            'vendor/jquery/jquery.min'
        ],
        jquery_browser: [
            '//cdnjs.cloudflare.com/ajax/libs/jquery-browser/0.0.6/jquery.browser.min',
            'vendor/jquery/jquery.browser.min'
        ],
        datatables: [
            '//cdn.datatables.net/1.10.0/js/jquery.dataTables.min',
            'vendor/jquery/dataTables/jquery.dataTables.min'
        ],
        'datatables-colvis': [
            '//cdn.datatables.net/colvis/1.1.0/js/dataTables.colVis.min',
            'vendor/jquery/dataTables/dataTables.colVis.min'
        ],
        'datatables-scroller': [
            '//cdn.datatables.net/scroller/1.2.1/js/dataTables.scroller.min',
            'vendor/jquery/dataTables/dataTables.scroller.min'
        ],
        'datatables-tabletools': [
            '//cdn.datatables.net/tabletools/2.2.1/js/dataTables.tableTools.min',
            'vendor/jquery/dataTables/dataTables.tableTools.min'
        ],
        datatables_bootstrap: [
            '//cdn.datatables.net/plug-ins/e9421181788/integration/bootstrap/3/dataTables.bootstrap',
            'vendor/jquery/dataTables/dataTables.bootstrap'
        ],
        underscore: [
            '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
            'vendor/underscore/underscore-min'
        ],
        bootstrap: [
            '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
            'vendor/bootstrap/bootstrap.min'
        ],
        bootstrap_datepicker: 'vendor/bootstrap/bootstrap-datepicker',
        d3: ['//cdnjs.cloudflare.com/ajax/libs/d3/3.4.6/d3.min',
            'vendor/d3/d3.min'
        ],
        d3_nvd3: [
            '//cdnjs.cloudflare.com/ajax/libs/nvd3/1.1.15-beta/nv.d3.min',
            'vendor/d3/nv.d3.min'
        ],
        d3_box: 'vendor/d3/box',
        markerclusterer: 'vendor/maps/markerclusterer'
    },
    shim: {
        jquery_browser: { deps: ['jquery'] },
        bootstrap: { deps: ['jquery'] },
        bootstrap_datepicker: { deps: ['bootstrap'] },
        datatables_bootstrap: { deps: ['datatables', 'bootstrap'] },
        d3_nvd3: { deps: ['d3_global'] },
        d3_box: { deps: ['d3_global'] }
    }
});

define('mapLibraries', ['async!https://maps.googleapis.com/maps/api/js?v=3&key=AIzaSyANPfBBVteHSTx4o9O-kgjC8RVMuXW0O2o&sensor=false&libraries=geometry', 'markerclusterer']);
define('datatablesLibraries', ['datatables', 'datatables-colvis', 'datatables-scroller', 'datatables-tabletools', 'datatables_bootstrap']);
define('generalLibraries', ['jquery', 'jquery_browser', 'underscore', 'bootstrap', 'bootstrap_datepicker']);
define('d3Libraries', ['d3', 'd3_nvd3', 'd3_box']);

define('d3_global', ['d3'], function(d3Module) {
    window.d3 = d3Module;
});

requirejs(['tsa'], function(tsa) {
    $(document).ready(tsa.initializeApplication);
});


/*
 * object.watch polyfill
 * By Eli Grey, http://eligrey.com
 */
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop, handler) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			}
			;

			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}
