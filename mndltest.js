/**
 * mndltest.js
 *
 * basic unit test framework. supports assert.isTrue and assert.equals. To run tests,
 * call tests.run(testCases), where testCases is a simple object with optional setup
 * and teardown properties, as well as test case properties. For example:
 *
 * test = {
 * 		setup: function() { 
 *			test.fixture = new Fixture();
 *		},
 *		teardown: function() {
 *			test.fixture = null;
 *		},
 *		"fixture property is not null": function() {
 *			test.isTrue(fixture.property !== null);
 *		}
 * }
 * -------------
 * Josh Chansard 
 * https://github.com/jchansard/mndltest
 */
module.exports = function($, id, container) {

	// css relies on it being div#mndltest-results
	const TEST_CONTAINER_ID = id || 'mndltest-results'
	const TEST_CONTAINER = container || 'div#' + TEST_CONTAINER_ID;
	var mndltest = {};

	// assertions; throws an AssertionError on fail
	mndltest.assert = {
		// actual must be true
		isTrue: function(actual)
		{
			var result = (actual === true);
			if (result === false) { this._throwAssertionError(actual); }
		},

		// returns true if actual equals expected; else throws assertion error
		equals: function(actual, expected)
		{
			result = this._equals(actual, expected);
			if (result === false) { this._throwAssertionError(actual, expected); }
		},

		_equals: function(actual, expected)
		{
			// if actual is null and expected is undefined, they're equal enough
			if ((actual === undefined && expected === null) || (actual === null && expected === undefined))
			{
				return true;
			}

			// with the above exception, actual and expected must have same type
			if (typeof actual !== typeof expected)
			{
				return false;
			}

			// if they're arrays, compare index by index 
			else if (actual instanceof Array && expected instanceof Array)
			{
				// if their lengths are different, they're not equal
				if (actual.length !== expected.length)
				{
					return false;
				}

				// compare index by index, recursively
				for (var i = 0; i < actual.length; i++)
				{
					if (!this._equals(actual[i], expected[i]))
					{
						return false;
					}
				}
				return true;
			}

			// if they're objects, compare property by property
			else if (typeof actual === 'object')
			{
				var prop;
				for (prop in actual) {

					// if actual has a property that expected doesn't, return false
					if (typeof expected[prop] === 'undefined') 
					{ 
						return false; 
					}
				    
				    // else recursively check equality of the two properties and return false if they're not equal
				    if (!this._equals(actual[prop], expected[prop])) 
				    {
				    	return false;
				    }
				}

				// if expected has a property that actual doesn't, return false
				for (prop in expected) {
				      
				    if (typeof actual[prop] ==='undefined') 
				    { 
				    	return false;
				    }
				}

				// if we made it here, they're equal
				return true;
			}

			// if they're functions, compare toStrings (this feels janky)
			else if (typeof actual === 'function')
			{
				return (actual.toString() == expected.toString());
			}

			// otherwise == comparison should suffice
			else
			{
				return (actual == expected);
			}
		},

		// throw an error that's caught by runTests
		_throwAssertionError: function(actual, expected)
		{
			if (expected === undefined) { expected = true; }
			var e = new Error();
			e.name = "AssertionError";
			e.message = "Expected " + expected + ", but " + actual + " was returned." 
			throw e;
		}
	};

	if ($)
	{
		mndltest.tests = {
			// current group of test cases
			_$currentList: undefined,

			// create elements to house results
			_start: function(testGroupName)
			{
				if ($(TEST_CONTAINER).length == 0)
				{
					$('body').append($(document.createElement('div')).attr('id',TEST_CONTAINER_ID));
					$(TEST_CONTAINER).click(function() { $(this).hide(200); });
				}
		
				var $div = $(document.createElement('div')).addClass('test-group pass').appendTo(TEST_CONTAINER)
					.append($(document.createElement('h2')).text(testGroupName));
				this._$currentList = $(document.createElement('ul')).appendTo($div);;
			},

			// cleanup
			_end: function()
			{
				this._$currentList = undefined;
			},

			// try fn, catching errors. if error, display fail message. 
			// otherwise, display pass message, unless suppressPass=true.
			_tryToDo: function(fn, message, suppressPass)
			{
				suppressPass = suppressPass || false;
				if (typeof fn === 'function')
				{
					try { 
						fn();
						if (!suppressPass) { this._addResult('pass', message,  fn.toString()); }
					}
					catch (e) {
						this._addResult('fail', message, fn.toString(), e);
						console.error(e)
					}
				}
			},

			// add a result <li>
			_addResult: function(result, description, functionToString, error)
			{
				var $testResult = $(document.createElement('li')).click(functionToString, this._displayTestFunction);
				$testResult = $testResult.addClass(result).html(description);
				if (error != undefined)
				{
					$(document.createElement('ul'))
						.append($(document.createElement('li')).html(error.name + ': ' + error.message))
						.appendTo($testResult);
				}
				if (result === 'fail') { this._$currentList.parents('div.test-group').addClass('fail').removeClass('pass'); }
				this._$currentList.append($testResult);
			},

			// display results. 
			_displayResults: function()
			{
				$(TEST_CONTAINER).show(200);
			},

			// displays a test case's test function
			_displayTestFunction: function(e) 
			{
				e.stopPropagation();

				if ($(this).data('preCreated'))	{ 
					$(this).children('pre').toggle(300);
				}

				if ($(this).data('preCreated') === undefined)
				{
					var funcDisplayHandler = function(e) {
						e.stopPropagation();
						$(this).children('pre').hide(300);
					}.bind(this);

					$(this).data('preCreated', true);
					$(document.createElement('pre'))
					.html(e.data)
					.click(funcDisplayHandler)
					.hide()
					.appendTo($(this))
					.show(300);
				}
			},

			dispatchEvent: function(type, properties, target)
			{
				var e = $.Event(type, properties);
				$(target).trigger(e);
			},

			// run tests
			run: function(testCases)
			{
				for (thisCase in testCases)
				{
					this._start(thisCase);
					
					var testCase = testCases[thisCase];
					var fns = Object.keys(testCase);
					var setup, teardown;
					var tests = [];
					var descriptions = [];
					var i;
					for (var i = 0; i < fns.length; i++)
					{
						if (fns[i] === 'setup') { setup = testCase[fns[i]]; }
						else if (fns[i] === 'teardown') { teardown = testCase[fns[i]]; }
						else {
							descriptions.push(fns[i]);
							tests.push(testCase[fns[i]]);
						}
					}
					this._tryToDo(setup, "Error during setup()", true);
					tests.forEach(function(test, index) {
						var message = descriptions[index];
						this._tryToDo(test, message, false)
					}.bind(this));
					this._tryToDo(teardown, "Error during teardown()", true);

					this._end();
				}
			}
		}
	}

	return mndltest;
}