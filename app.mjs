import { rmSync } from "fs";
import { compare, genSalt, hash } from "bcrypt";
import { createServer } from "http";
import express from "express";
import Datastore from "nedb";
import session from "express-session";
import { serialize } from "cookie";
import validator from "validator";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Ensure the 'uploads/' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

let users = new Datastore({ filename: 'db/users.db', autoload: true });
let items = new Datastore({ filename: 'db/items.db', autoload: true, timestampData: true });


// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save the file in the uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage: storage });

app.use(session({
    secret: 'please change this secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, 
        secure: false,
        samesite: 'strict' 
    }
}));

app.use(function (req, res, next) {
    const username = (req.session.user) ? req.session.user._id : '';
    res.setHeader('Set-Cookie', serialize('username', username, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    next();
});

app.use(function (req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

function isAuthenticated(req, res, next) {
    if (!req.session.user) return res.status(401).end("access denied");
    next();
};

const checkUsername = function (req, res, next) {
    if (!validator.isAlphanumeric(req.body.username)) return res.status(400).end("bad input");
    next();
};

const sanitizeContent = function (req, res, next) {
    req.body.content = validator.escape(req.body.content);
    next();
}

const checkId = function (req, res, next) {
    if (!validator.isAlphanumeric(req.params.id)) return res.status(400).end("bad input");
    next();
};

// curl -X POST -d "username=admin&password=pass4admin" http://localhost:3000/signup/
app.post('/signup/', checkUsername, function (req, res, next) {
    if (!('username' in req.body)) return res.status(400).end('username is missing');
    if (!('password' in req.body)) return res.status(400).end('password is missing');
    var username = req.body.username;
    var password = req.body.password;
    users.findOne({ _id: username }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + username + " already exists");
        genSalt(10, function (err, salt) {
            hash(password, salt, function (err, hash) {
                users.update({ _id: username }, { _id: username, hash: hash }, { upsert: true }, function (err) {
                    if (err) return res.status(500).end(err);
                    return res.redirect("/");
                });
            });
        });
    });
});




// curl -X POST -d "username=admin&password=pass4admin" -c cookie.txt http://localhost:3000/signin/
app.post('/signin/', checkUsername, function (req, res, next) {
    if (!('username' in req.body)) return res.status(400).end('username is missing');
    if (!('password' in req.body)) return res.status(400).end('password is missing');
    var username = req.body.username;
    var password = req.body.password;
    users.findOne({ _id: username }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("access denied");
        compare(password, user.hash, function (err, valid) {
            if (err) return res.status(500).end(err);
            if (!valid) return res.status(401).end("access denied");
            req.session.user = user;
            res.setHeader('Set-Cookie', serialize('username', user._id, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
            }));
            return res.redirect("/");
        });
    });
});

// curl -b cookie.txt -c cookie.txt http://localhost:3000/signout/
app.get('/signout/', function (req, res, next) {
    req.session.destroy();
    res.setHeader('Set-Cookie', serialize('username', '', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    return res.redirect("/");
});

app.get("/api/items/", function (req, res, next) {
    const limit = Math.max(1, (req.params.limit) ? parseInt(req.params.limit) : 1);
    const page = (req.params.page) || 0;
    items.find({})
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit)
        .exec(function (err, items) {
            if (err) return res.status(500).end(err);
            return res.json(items.reverse());
        });
});

app.post('/api/items/', isAuthenticated, upload.single('image'), sanitizeContent, function (req, res, next) {
    const { content } = req.body;
    const owner = req.session.user._id;

    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    items.insert({ content, owner, imageUrl }, function (err, item) {
        if (err) return res.status(500).end(err);
        return res.json(item);
    });
});

app.get('/api/items/:id/', checkId, function (req, res, next) {
    items.findOne({ _id: req.params.id }, function (err, item) {
        if (err) return res.status(500).end(err);
        if (!item) return res.status(404).end("Item id #" + req.params.id + " does not exist");
        return res.json(item);
    });
});

app.delete('/api/items/:id/', isAuthenticated, checkId, function (req, res, next) {
    items.findOne({ _id: req.params.id }, function (err, item) {
        if (err) return res.status(500).end(err);
        if (item.owner !== req.session.user._id) return res.status(403).end("forbidden");
        if (!item) return res.status(404).end("Item id #" + req.params.id + " does not exist");
        items.remove({ _id: item._id }, { multi: false }, function (err, num) {
            res.json(item);
        });
    });
});

app.get("/api/users", function (req, res, next) {
    users.find({}).exec(function (err, users) {
        if (err) return res.status(500).end(err);
        return res.json(users.reverse())
    });
});



app.post('/api/items/:id/comments', isAuthenticated, function (req, res) {
    const itemId = req.params.id;
    const { content } = req.body;
    const owner = req.session.user._id; // 评论创建者

    // 创建评论对象
    const comment = {
        _id: new Date().getTime(), // 简单的唯一ID
        content: validator.escape(content), // 清理输入
        owner: owner, // 评论者
        createdAt: new Date(),
        deleted: 0,
        likes: 0,      // 初始化点赞数
        dislikes: 0,    // 初始化点踩数
    };
    // 将评论添加到项目中
    items.update({ _id: itemId }, { $push: { comments: comment } }, {}, function (err) {
        if (err) return res.status(500).end(err);
        res.status(201).end(); // 评论添加成功
    });
});

app.use('/uploads', express.static('uploads'));
app.use(express.static("static"));

// This is for testing purpose only
export function createTestDb(db) {
    items = new Datastore({
        filename: "testdb/items.db",
        autoload: true,
        timestampData: true,
    });
    users = new Datastore({
        filename: "testdb/users.db",
        autoload: true,
    });
}

// This is for testing purpose only
export function deleteTestDb(db) {
    rmSync("testdb", { recursive: true, force: true });
}

// This is for testing purpose only
export function getItems(callback) {
    return items.find({}).sort({ createdAt: -1 }).exec(function (err, items) {
        if (err) return callback(err, null);
        return callback(err, items.reverse());
    });
}

// This is for testing purpose only
export function getUsers(callback) {
    return users.find({}).sort({ createdAt: -1 }).exec(function (err, users) {
        if (err) return callback(err, null);
        return callback(err, users.reverse());
    });
}

export const server = createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});

app.get("/todos/:id", function (req, res, next) {
    const userId = req.params.id;
    items.find({ owner: userId }, function (err, userItems) {
        if (err) return res.status(500).end(err);
        if (!userItems) return res.status(404).end("user does not exist " + userId);
        res.json(userItems);
    });
});


app.patch('/api/items/:itemId/comments/:commentId', isAuthenticated, function (req, res) {
    const itemId = req.params.itemId;
    const commentId = req.params.commentId;
    const userId = req.session.user._id;

    items.findOne({ _id: itemId }, function (err, item) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const commentIndex = item.comments.findIndex(c => c._id == commentId);
        if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

        const comment = item.comments[commentIndex];
        if (comment.owner !== userId && item.owner !== userId) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // 手动设置 deleted 属性为 1
        item.comments[commentIndex].deleted = 1;

        // 保存整个项目
        items.update({ _id: itemId }, item, {}, function (err, numAffected) {
            if (err) return res.status(500).json({ error: 'Failed to update item' });
            res.status(200).json({ message: 'Comment marked as deleted successfully' });
        });
    });
});






  
  