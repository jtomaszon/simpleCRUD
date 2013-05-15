$('.course').bind('click', function() {
  $.ajax({
    url: '/getCourse', 
    data: {
        code: $(this).text()
    }, 
    type: 'POST',
    success: function(data) {
      if (data) {
        document.getElementById("conteudo").style.display = 'block'
        $('#courseName').html('<b>Curso </b>' + data.name)
        $('#courseLocation').html('<b>Local </b>' + data.location)
        $('#dueDateSIAT').html(data.dueDateSIAT)
        $('#dueDateDECEA').html(data.dueDateDECEA)
        $('#startDate').html(data.startDate)
        $('#endDate').html(data.endDate)
        $("#cadastro #users").val('')
        $("#saveCourse").attr('disabled', 'disabled')
        $("#saveCourse").removeClass('btn-primary')
        $("#saveCourse").addClass('disabled')
        $("#saveCourse").addClass('btn')

        var c = $('ul#cadastrados').children('li');
        resetElement(c);


        
      }
    }
  });
});

$('#users').typeahead({
  source: function (query, process) {
    return $.get('/getUsers', { q: query }, function (data) {
      return process(data);
    });
  }
});

$("#submitButtonId").click(function() {
  $.ajax({
    type: "GET",
    url: "/getUser?q="+ $("#cadastro #users").val(),
    success: function(data) {
      var container = $("ul#cadastrados"),
          alunoList = $('<li>'),
          aluno = $('<div>'),
          button = $('<button>')

      aluno.addClass('text-success')

      button.prop('type', 'button')
      button.attr('data-dismiss', 'alert')
      button.addClass('close')
      button.html('&times;')

      aluno.append(button)
      aluno.append(data.name)

      alunoList.html(aluno)
      container.append(alunoList);

      $("#saveCourse").removeAttr('disabled')
      $("#saveCourse").removeClass('disabled')
      $("#saveCourse").removeClass('btn')
      $("#saveCourse").addClass('btn-primary')
      
      $('#myModal').modal('show')
    }
  });
  return false;
});

$("#myModal #saveCourse").click(function() {
  var course  = window.location.hash.substring(1)
  var user    = $("#cadastro #users").val()
  var nOS     = $("#myModal #nOS").val()
  var nParent = $("#myModal #nParent").val()


  var c = $('ul#cadastrados').children('li');
  resetElement(c);

  $.ajax({
    type: "POST",
    url: "/addToCourse",
    data: { course: course, user: user, nOS: nOS, nParent: nParent},
    success: function(data) {
      $('#myModal').modal('hide')
    }
  });
  return false;
});


$('#cadastrados').on('click', '.foo', function () {
  $(this).remove();
});


// Utils
function resetElement (el) {
  if (el.length > 0) {
    for (var i=0;i<el.length;i++){ 
      el[i].remove()
    }          
  }
}
