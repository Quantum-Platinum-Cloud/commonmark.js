"use strict";

/*eslint-env browser*/
/*global $, _ */

var commonmark = window.commonmark;
var writer = new commonmark.HtmlRenderer({ sourcepos: true });
var xmlwriter = new commonmark.XmlRenderer({ sourcepos: true });
var reader = new commonmark.Parser();

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] === variable){
      return decodeURIComponent(pair[1]);
    }
  }
  return null;
}

$(document).ready(function() {
  var timer;
  var x;
  var parsed;
  var textarea = $("#text");
  var render = function() {
    if (parsed === undefined) {
      return;
    }
    var startTime = new Date().getTime();
    var result = writer.render(parsed);
    var endTime = new Date().getTime();
    var renderTime = endTime - startTime;
    $("#preview").html(result);
    $("#html").text(result);
    $("#ast").text(xmlwriter.render(parsed));
    $("#rendertime").text(renderTime);
  };
  var syncScroll = function() {
    var lineHeight = parseFloat(textarea.css('line-height'));
    // TODO this ignores the fact that lines can wrap - fix!
    var lineNumber = Math.floor(textarea.scrollTop() / lineHeight) + 1;
    var elt = $("#preview [data-sourcepos^='" + lineNumber + ":']").last();
    if (elt.length > 0) {
        if (elt.offset()) {
            var curTop = $("#preview").scrollTop();
            $("#preview").animate({
                scrollTop: curTop + elt.offset().top - 100
            }, 50);
        }
    }
  };
  var markSelection = function() {
    var cursorPos = $("#text").prop("selectionStart");
    // now count newline up to this pos
    var textval = $("#text").val();
    var lineNumber = 1;
    for (var i = 0; i < cursorPos; i++) {
        if (textval.charAt(i) === '\n') {
            lineNumber++;
        }
    }
    var elt = $("#preview [data-sourcepos^='" + lineNumber + ":']").last();
    if (elt.length > 0) {
        $("#preview .selected").removeClass("selected");
        elt.addClass("selected");
        syncScroll();
    }
  };
  var parseAndRender = function() {
    if (x) { x.abort(); } // If there is an existing XHR, abort it.
    clearTimeout(timer); // Clear the timer so we don't end up with dupes.
    timer = setTimeout(function() { // assign timer a new timeout
      var startTime = new Date().getTime();
      parsed = reader.parse(textarea.val());
      var endTime = new Date().getTime();
      var parseTime = endTime - startTime;
      $("#parsetime").text(parseTime);
      $(".timing").css('visibility', 'visible');
      render();
      markSelection();
    }, 0); // ms delay
  };
  var initial_text = getQueryVariable("text");
  if (initial_text) {
    textarea.val(initial_text);
    // show HTML tab if text is from query
    $('#result-tabs a[href="#result"]').tab('show');
  }

  parseAndRender();
  $("#clear-text-box").click(function() {
    textarea.val('');
    parseAndRender();
  });
  $("#permalink").click(function() {
    window.location.pathname = "/index.html";
    window.location.search = "text=" + encodeURIComponent(textarea.val());
  });
  textarea.bind('input propertychange', _.debounce(parseAndRender, 50, { maxWait: 100 }));
  textarea.on('scroll', _.debounce(syncScroll, 50, { maxWait: 50 }));
  textarea.on('keydown click focus', _.debounce(markSelection, 50, { maxWait: 100}));
  $("#smart").click(function() {
      reader = new commonmark.Parser({smart: $("#smart").is(":checked")});
      parseAndRender();
  });
});
