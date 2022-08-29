const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const session = require('express-session')
const flash = require('express-flash')
const upload = require('./middleware/fileUpload')
const port = 8000

app.set('view engine', 'hbs')
app.use('/assets', express.static(__dirname + '/assets'))
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 1 * 60 * 60 * 1000 // 1 Jam
  }
}))

const db = require('./connection/db')

let isTrue = true;


app.get('/', (req, res) => { 
  
  db.connect((err, client, done) => {
    if(err) throw err

    let query;
    if(!req.session.isLogin) {
      query = `SELECT tb_projects.id, tb_projects.name,tb_projects.author_id ,tb_projects.description, tb_projects.technologies, tb_projects.start_date, tb_projects.end_date, tb_projects.image, tb_user.username as author
      FROM tb_projects
      LEFT JOIN tb_user ON tb_projects.author_id = tb_user.user_id ORDER BY id DESC`
    }else {
      let autId = req.session.user.userId
      query = `SELECT tb_projects.id, tb_projects.name,tb_projects.author_id ,tb_projects.description, tb_projects.technologies, tb_projects.start_date, tb_projects.end_date, tb_projects.image, tb_user.username as author
      FROM tb_projects
      LEFT JOIN tb_user ON tb_projects.author_id = tb_user.user_id WHERE author_id = ${autId} ORDER BY id DESC`
    }


    client.query(query, (err, result) => {
      if(err) throw err // Query Error

      // console.table(result.rows);
      let dataResult = result.rows

      console.log(req.session)

      let dataMapping = dataResult.map((res) => {
        return {
          ...res,
          duration: getTime(res.start_date, res.end_date),
        }
      })
      res.render('index', {dataResult : dataMapping, isTrue, isLogin: req.session.isLogin, user: req.session.user})
    })
  })

})

// Contact
app.get('/contact', (req, res) => {
  res.render('contact', {isLogin: req.session.isLogin, user: req.session.user})
})

// Project
app.get('/project', (req, res) => {

  if(!req.session.user) {
    req.flash('danger', 'harap login terlebih dahulu!')
    res.redirect('/login')
  }

  res.render('project', {isLogin: req.session.isLogin, user: req.session.user})
})


app.post('/project', upload.single('inputImg'), (req, res) => {
  let {
   inputName: name,
   inputStartDate: sDate,
   inputEndDate: eDate,
   inputDesc: desc,
   bootStrap : bootstrap,
   reactJs : react,
   laravel : laravel,
   nodeJs : node
  } = req.body

  const image = req.file.filename

  db.connect((err, client, done) => {
    if(err) throw err
    let authorId = req.session.user.userId
    
    let queryData = `INSERT INTO public.tb_projects(name, start_date, end_date, description, technologies, image,author_id)
      VALUES ('${name}', '${sDate}', '${eDate}', '${desc}', '{"${node}", "${laravel}", "${react}", "${bootstrap}"}', '${image}', '${authorId}');`

    client.query(queryData, (err, result) => {
      if(err) throw err // Query Error
      res.redirect('/')
    })
  })

})

// Delete
app.get('/delete-project/:id', (req, res) => {
  let id = req.params.id

  db.connect((err, client, done) => {
    if(err) throw err

    if(!req.session.user) {
      req.flash('danger', 'harap login terlebih dahulu!')
      return res.redirect('/login')
    }

    let queryData = `DELETE FROM public.tb_projects WHERE id=${id};`
    client.query(queryData, (err, result) => {
      if(err) throw err // Query Error
      res.redirect('/')
    })
  })
})


// Edit 
app.get('/edit-project/:id', (req, res) => {
  let id = req.params.id

  db.connect((err, client, done) => {
    if(err) throw err

    if(!req.session.user) {
      req.flash('danger', 'harap login terlebih dahulu!')
      res.redirect('/login')
    }

    let queryData = `SELECT * FROM tb_projects WHERE id=${id}`
    client.query(queryData, (err, result) => {
      if(err) throw err // Query Error

      let resultRows = result.rows
      let dataRows = {
        name: resultRows[0].name,
        desc: resultRows[0].description,
        image: resultRows[0].image,
        sDate: getStart(resultRows[0].start_date),
        eDate: getEnd(resultRows[0].end_date)
      }
      res.render('edit-project', {dataRows, id, isTrue, isLogin: req.session.isLogin, user: req.session.user})
    })
  })

})

app.post('/edit-project/:id', upload.single('inputImg'),(req, res) => {
  let id = req.params.id
  let {
    inputName: name,
    inputStartDate: sDate,
    inputEndDate: eDate,
    inputDesc: desc,
    bootStrap : bootstrap,
    reactJs : react,
    laravel : laravel,
    nodeJs : node
   } = req.body

   let image = req.file.filename

  db.connect((err, client, done) => {
    if(err) throw err



    let queryData = `UPDATE public.tb_projects
    SET name='${name}', start_date='${sDate}', end_date='${eDate}', description='${desc}', image='${image}',technologies='{"${node}", "${laravel}", "${react}", "${bootstrap}"}'
  WHERE id=${id};`

    client.query(queryData, (err, result) => {
      if(err) throw err // Query Error

      res.redirect('/')
    })
  })
})


// Detail
app.get('/detail/:id', (req, res) => { 
  let id = req.params.id
  db.connect((err, client, done) => {
    if(err) throw err

    if(!req.session.isLogin){
      req.flash('danger', 'harap login terlebih dahulu')
      return res.redirect('/login')
    } 

    let queryScript = `SELECT * FROM public.tb_projects WHERE id=${id}` 


    client.query(queryScript, (err, result) => {
      if(err) throw err // Query Error

      let dataRows = result.rows
      console.log(dataRows)
      let dataProject = dataRows.map((res) => {
        return{
          ...res,
          duration:getTime(res.start_date, res.end_date) ,
          startDate: getStart(res.start_date),
          endDate: getEnd(res.end_date),
          image: res.image,
          technoNode: res.technologies[0],
          technoLaravel: res.technologies[1],
          technoReact: res.technologies[2],
          technoBoots: res.technologies[3]
        }
      })
      res.render('detail', {dataRows : dataProject[0], isTrue, isLogin: req.session.isLogin, user: req.session.user})
    })
  })
})


// Register
app.get('/register', (req, res) => {
  res.render('register', {isLogin: req.session.isLogin})
})

app.post('/register', (req, res) => {
  db.connect((err, client, done) => {
    if(err) throw err

    let {inputUsername, inputEmail, inputPassword} = req.body

    const hashPassword = bcrypt.hashSync(inputPassword, 10); // Hash Password

    let queryData = `INSERT INTO public.tb_user(username, email, password)
      VALUES ('${inputUsername}', '${inputEmail}', '${hashPassword}');`

  client.query(queryData, (err, result) => {
    if(err) throw err // Query Error
    
    res.redirect('/login')
  })

})

})

// Login
app.get('/login', (req, res) => {

  res.render('login', {isLogin: req.session.isLogin})
})

app.post('/login',  (req, res) => {

  db.connect((err, client, done) => {
    if(err) throw err

    let {inputEmail, inputPassword} = req.body

    let query = `SELECT * FROM tb_user WHERE email='${inputEmail}'`

    client.query(query, (err, result) => {
      if(err) throw err

      if(result.rows.length == 0) {
        req.flash('danger', 'email atau password belum terdaftar')
        res.redirect('/login')
        return;
      }

      let currentPassword = result.rows[0].password

      const isMatch = bcrypt.compareSync(inputPassword, currentPassword)

      if(isMatch) {
        req.flash('success', 'anda berhasil login!')
        console.log('password valid')
        
        req.session.isLogin = true
        req.session.user = {
          userId: result.rows[0].user_id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          password: result.rows[0].password
        }
        res.redirect('/')
        console.log(req.session);
        
      }else {
        req.flash('danger', 'anda pasti lupa password')
        res.redirect('/login')  
        console.log('Password tidak valid')
      }

    }
    )
  })
})

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy()

  res.redirect('/login')
})





// Function GetTime
const getTime = (start,end) => {

  let date1 = new Date(start)
  let date2 = new Date(end)
  let time = Math.abs(date2 - date1)
  let days = Math.floor(time / (1000 * 60 * 60 * 24))

  return `${days} hari`
  
}

function getStart(start) {
  let d = new Date(start),
  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

if (month.length < 2) 
  month = '0' + month;
if (day.length < 2)   
  day = '0' + day;

return [year, month, day].join('-');
} 

function getEnd(end) {
  let d = new Date(end),
  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

if (month.length < 2) 
  month = '0' + month;
if (day.length < 2) 
  day = '0' + day;

return [year, month, day].join('-');
} 


app.listen(port, () => {
  console.log(`Server Running on Port ${port}`)
})
