/**
 * mndltest.js
 *
 * basic unit test framework. supports assert.isTrue and assert.equals. To run tests,
 * call mndltest.runTests(tests), where tests is a simple object with optional setup
 * and teardown properties, as well as test case properties. For example:
 *
 * test = {
 * 		setup: function() { 
 *			this.fixture = new Fixture();
 *		},
 *		teardown: function() {
 *			this.fixture = null;
 *		},
 *		"fixture property is not null": function() {
 *			assert.isTrue(fixture.property !== null);
 *		}
 * }
 * -------------
 * Josh Chansard 
 * https://github.com/jchansard/mndltest
 */
(function() {
	const TEST_CONTAINER_ID = 'mndltest-results'
	const TEST_CONTAINER = 'div#' + TEST_CONTAINER_ID;

	this.assert = {
		isTrue: function(actual, description)
		{
			var result = (actual === true);
			this._throwAssertError(actual)
		},

		equals: function(actual, expected, description)
		{
			var result = (actual == expected);
			this._throwAssertError(actual, expected);
		},

		_throwAssertError: function(actual, expected)
		{
			if (expected === undefined) { expected = true; }
			var e = new Error();
			e.name = "AssertionError";
			e.message = "Expected " + expected + ", but " + actual + " was returned." 
			throw e;
		}
	};

	this.mndltest = {
		_$currentList: undefined,
		start: function(testGroupName)
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

		addResult: function(result, description, error)
		{
			var $testResult = $(document.createElement('li'));
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

		end: function()
		{
			this._$currentList = undefined;
		},

		displayResults: function()
		{
			$(TEST_CONTAINER).show(200);
		},

		runTests: function(testCases)
		{
			for (thisCase in testCases)
			{
				mndltest.start(thisCase);
				
				var testCase = testCases[thisCase];
				var fns = Object.keys(testCase);
				var setup = testCase[fns[0]];
				var tests = [];
				var descriptions = [];
				var i;
				for (var i = 1; i < fns.length - 1; i++)
				{
					descriptions.push(fns[i]);
					tests.push(testCase[fns[i]]);
				}
				var teardown = testCase[fns[i]];
				if (setup) { setup(); }
				tests.forEach(function(test, index) {
					try {
						test();
						mndltest.addResult('pass', descriptions[index]);
					}
					catch (e)
					{
						var message = descriptions[index];
						mndltest.addResult('fail', message, e);
					}
				});

				if (teardown) { teardown(); }

				mndltest.end();
			}
		}
	}
})();