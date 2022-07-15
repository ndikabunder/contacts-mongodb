const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');

require('./utils/db');
const Contact = require('./model/contact');

const app = express();
const port = 3000;

// Setup methodoverride
app.use(methodOverride('_method'));

// Setup EJS
app.set('view engine', 'ejs');
app.use(expressLayouts); // Third-party middleware
app.use(express.static('public')); // Built-in middleware
app.use(
    express.urlencoded({
        extended: true,
    })
);

// Flash
app.use(cookieParser('secret'));
app.use(
    session({
        cookie: { maxAge: 6000 },
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());

// Halaman home
app.get('/', (req, res) => {
    const keluarga = [
        {
            nama: 'Andika',
            email: 'andika@gmail.com',
        },
        {
            nama: 'Fony',
            email: 'fony@gmail.com',
        },
        {
            nama: 'Ghibran',
            email: 'ghibran@gmail.com',
        },
    ];
    res.render('index', {
        layout: 'layouts/main-layout',
        nama: 'Andika',
        title: 'Halaman Home',
        keluarga,
    });
});

// Halaman about
app.get('/about', (req, res) => {
    res.render('about', {
        layout: 'layouts/main-layout',
        title: 'Halaman About',
    });
});

// Halaman contact
app.get('/contact', async (req, res) => {
    const contacts = await Contact.find();

    res.render('contact', {
        layout: 'layouts/main-layout',
        title: 'Halaman Contact',
        contacts,
        msg: req.flash('msg'),
    });
});

// Halaman Tambah Contact
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        layout: 'layouts/main-layout',
        title: 'Form Tambah Data Contact',
    });
});

// Menambah Data Contact
app.post(
    '/contact',
    [
        body('nama').custom(async (value) => {
            const duplikat = await Contact.findOne({ nama: value });
            if (duplikat) {
                throw new Error('Nama contact sudah terdaftar');
            }
            return true;
        }),
        check('email', 'Email tidak valid').isEmail(),
        check('nohp', 'No HP tidak valid').isMobilePhone('id-ID'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('add-contact', {
                title: 'Form Tambah Data Contact',
                layout: 'layouts/main-layout',
                errors: errors.array(),
            });
        } else {
            Contact.insertMany(req.body, (error, result) => {
                req.flash('msg', 'Data contact berhasil ditambahkan');
                res.redirect('/contact');
            });
        }
    }
);

// Menghapus contact
// app.get('/contact/delete/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama });

//     if (!contact) {
//         res.status(404);
//         res.send('<h1>404</h1>');
//     } else {
//         Contact.deleteOne({ _id: contact._id }).then((result) => {
//             req.flash('msg', 'Data contact berhasil dihapus');
//             res.redirect('/contact');
//         });
//     }
// });
app.delete('/contact', (req, res) => {
    Contact.deleteOne({ nama: req.body.nama }).then((result) => {
        req.flash('msg', 'Data contact berhasil dihapus');
        res.redirect('/contact');
    });
});

// Halaman ubah contact
app.get('/contact/edit/:nama', async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama });

    res.render('edit-contact', {
        layout: 'layouts/main-layout',
        title: 'Form Ubah Data Contact',
        contact,
    });
});

// Merubah data contact
app.put(
    '/contact',
    [
        body('nama').custom(async (value, { req }) => {
            const duplikat = await Contact.findOne({ nama: value });
            if (value !== req.body.oldNama && duplikat) {
                throw new Error('Nama contact sudah terdaftar');
            }
            return true;
        }),
        check('email', 'Email tidak valid').isEmail(),
        check('nohp', 'No HP tidak valid').isMobilePhone('id-ID'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('edit-contact', {
                title: 'Form Ubah Data Contact',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                contact: req.body,
            });
        } else {
            Contact.updateOne(
                { _id: req.body._id },
                {
                    $set: {
                        nama: req.body.nama,
                        email: req.body.email,
                        nohp: req.body.nohp,
                    },
                }
            ).then((result) => {
                req.flash('msg', 'Data contact berhasil diubah');
                res.redirect('/contact');
            });
        }
    }
);

// Halaman detail contact
app.get('/contact/:nama', async (req, res) => {
    // const contact = findContact(req.params.nama);
    const contact = await Contact.findOne({
        nama: req.params.nama,
    });

    res.render('detail', {
        layout: 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact,
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
