var express = require("express"),
siat = require("./routes/siat"),
app = express();

var mongo = require('mongodb'),
Server = mongo.Server,
Db = mongo.Db,
ObjectID = require('mongodb').ObjectID;

var RedisStore = require('connect-redis')(express);

//connecting to mongo
var server = new Server('localhost', 27017, {
  auto_reconnect: true
});
db = new Db('siat', server, {safe:true});
db.open(function(err, db) {
  if(!err) {
    console.log("Connected to database: siat");
  }
});

// var redis = require("redis"),
// r = redis.createClient();

// Configuration
app.configure(function(){
  app.set('port', process.env.PORT || 3000);    
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });

  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: "SiatFAB",
    store: new RedisStore
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', loadUser, function (req, res) {
  res.render('users', {
    user: req.currentUser,
    courses: req.userCourses
  });

});

app.get('/login', function (req, res) {
  res.render('login');
  console.log()
});

app.post('/login', function (req, res) {
  db.collection("users", function (err, collection) {
    collection.findOne({
      cpf: req.body.cpf
    }, function (err, doc) {
      if (doc && doc.passwd === req.body.passwd) {
        req.session.user_id = doc._id;
        res.redirect('/');
      }else {
        res.redirect('/cadastro')
      }
    });
  });
});

app.get('/logout', function (req, res) {
  req.session.user = undefined;
  res.clearCookie('connect.sid', { path: '/' });
  res.redirect('/');
});

app.get('/cadastro', function (req, res) {
  res.render('signin');
  console.log()
});

app.post('/cadastro', function (req, res) {
  var user = req.body;
  console.log('Adding user: ' + JSON.stringify(user));
  db.collection("users", function (err, collection) {
    collection.insert(user, {safe: true}, function(err, result){
      if (!err) {
        console.log('Success: ' + JSON.stringify(result[0]));
        res.redirect('/')
      } else {
        res.render('signin', {
          status: "error"
        })
      }
    });
  });
});

app.post('/addToCourse', function (req, res) {
  var request = req.body;
  console.log(request);

  db.collection("courses", function (err, collection) {
    collection.findOne({
      code: request.course
    }, function (err, course) {
      console.log(course);
      if (course) {

        db.collection("users", function (err, collection) {

          var data = {};
          data = {courses: { "courseId": course._id, "status" : "ATIVO", nOS: request.nOS, nParent: request.nParent}};

          collection.update({ cpf: request.user }, { $set: data } , {safe:true}, function(err, result){
            if (err) {
                console.log('Error updating: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send({'status': 'DOCUMENT_SAVED'});
            }
          });
        });



      }
    });
  });
});

function loadUser(req, res, next) {
  if (req.session.user_id) {
    db.collection("users", function (err, collection) {
      collection.findOne({
        _id: new ObjectID(req.session.user_id)
      }, function (err, user) {
        if (user) {
          req.currentUser = user;
          if (user.courses !== undefined) {
            db.collection("courses", function (err, collection) {
              collection.findOne({
                _id: user.courses.courseId
              }, function (err, course) {
                if (course) {
                  req.userCourses = course;
                  next()
                }
              });
            });

          } else {
            req.userCourses = "";
            next()
          }
        } else {
          res.redirect('/login');
        }
      });
    });
  } else {
    res.redirect('/login');
  }
}


// Administration routes
app.get('/admin', loadUser, function (req, res) {
  res.render('admin', {
    user: req.currentUser
  });
  console.log('System is under Administrator Power');
})

app.get('/courses', loadUser, function (req, res) {

  db.collection('courses', function(err, collection) {
    collection.distinct('code', function(err, courses) {

      res.render('courses', {
        user: req.currentUser,
        courses: courses
      });         

    });
  })
})

app.post('/getCourse', loadUser, function (req, res) {
  var code = req.body.code;

  db.collection('courses', function(err, collection) {
    collection.findOne({code: code}, function(err, course) {
      res.send(course);
    });
  })
})

app.get('/getUsers', loadUser, function (req, res) {
  var q = req.query.q
  db.collection('users', function(err, collection) {
    collection.distinct('cpf', {cpf: {'$regex': q }}, function(err, users) {
      res.send(users);         
    });
  });
})

app.get('/getUser', loadUser, function (req, res) {
  var cpf = req.query.q;
  db.collection('users', function(err, collection) {
    collection.findOne({cpf: cpf}, function(err, users) {
      res.send(users);         
    });
  });
})

app.listen(app.get('port'), function () {
  console.log("Server listening on port " + app.get('port'));
});
