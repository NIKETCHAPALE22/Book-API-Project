require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
//Database
const database = require("./database");

//Modules
const BookModel = require("./database/book");
const AuthorModel = require("./database/author");
const PublicationModel = require("./database/publication");

//Initialize express
const booky = express();

booky.use(bodyParser.urlencoded({extended: true}));
booky.use(bodyParser.json());

//Establish Database Connection
mongoose.connect(
    process.env.MONGO_URL
).then(()=> console.log("Connection Establish"));  

//Get All Books
/*
Route            /
Description      Get all the books
Access           PUBLIC
Parameter        NONE
Methods          GET
*/
booky.get("/", async (req,res) => {
    const getAllBooks = await BookModel.find();
    return res.json(getAllBooks);
});

//GET A SPECIFIC BOOKS localhost:1000/12345Books
/*
Route            /is
Description      Get Specific books
Access           PUBLIC
Parameter        isbn
Methods          GET
*/
booky.get("/is/:isbn", async (req,res) => {
 const getSpecificBook = await BookModel.findOne({ISBN:req.params.isbn});

    if(!getSpecificBook) {
        return res.json({
            error: `No book Found for ISBN of ${req.params.isbn}`
        });
    }

    return res.json({book: getSpecificBook});

});

//Get BOOKS on specific category
/*
Route            /c
Description      Get all the books
Access           PUBLIC
Parameter        category
Methods          GET
*/

booky.get("/c/:category", async (req,res)=> {

const getSpecificBook = await BookModel.findOne({category: req.params.category});
//If no specific book is returned the, the find func returns null, and execute the not
//found property we have to make the condn inside if true, !null is true

    if(!getSpecificBook) {
        return res.json({
            error: `No book Found for category of ${req.params.category}`
        });
    }

    return res.json({book: getSpecificBook});
  
});
//Get All Authors
/*
Route            /author
Description      Get all author
Access           PUBLIC
Parameter        NONE
Methods          GET
*/
booky.get("/author", async (req,res)=> {
    const getAllAuthors = AuthorModel.find();
    return res.json(getAllAuthors);
});

//Get All Author BASED ON BOOKS
/*
Route            /author/book
Description      Get all author based on books
Access           PUBLIC
Parameter        NONE
Methods          GET
*/

booky.get("/author/book/:isbn", async(req,res)=> {
    const getSpecificAuthor = await AuthorModel.findOne({books: req.params.isbn});

    if(!getSpecificAuthor) {
        return res.json({
            error: `No Author Found for isbn of ${req.params.author}`
        });
    }

    return res.json({authors: getSpecificAuthor}); 
});

//Get All PUBLICATION
/*
Route            /publication
Description      Get all publication
Access           PUBLIC
Parameter        NONE
Methods          GET
*/

booky.get("/publication", async(req,res)=> {
    const getAllPublications = PublicationModel.find();
    return res.json(getAllPublications);
});

//ADD New BOOKS
/*
Route            /book/new
Description      add new Books
Access           PUBLIC
Parameter        NONE
Methods          POST
*/

booky.post("/book/new", async(req,res)=> {
    const { newBook } = req.body;
    const addNewBook = BookModel.create(newBook);
    return res.json({books: addNewBook, message:"Book was added!"});
});

//ADD NEW AUTHORS
/*
Route            /author/new
Description      add new Books
Access           PUBLIC
Parameter        NONE
Methods          POST
*/

booky.post("/author/new", (req,res)=> {
    const { newAuthor } = req.body;
    AuthorModel.create(newAuthor);
    return res.json({authors: database.authors, message:"Author was added"});
});

//ADD NEW PUBLICATION
/*
Route            /publication/new
Description      add new Publication
Access           PUBLIC
Parameter        NONE
Methods          POST
*/

booky.post("/publication/new", (req,res)=> {
    const newPublication = req.body;
    database.publication.push(newPublication);
    return res.json({updatedPublication: database.publication});
});

//UPDATE a BOOK title
/*
Route            /book/update/:isbn
Description      update title of the book
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/
booky.put("/book/update/:isbn", async(req,res)=> {
    const updatedBook = await BookModel.findOneAndUpdate (
        {
            ISBN: req.params.isbn 
        },
        {
            title: req.body.bookTitle
        },
        {
            new: true
        }
    );

    return res.json({books: database.books});
});

//UPDATE a new AUTHOR
/*
Route            /book/author/update
Description      update/add new book
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/
booky.put("/book/author/update/:isbn", async(req,res)=> {
    const updatedBook = await BookModel.findOneAndUpdate(
        {
            ISBN: req.params.isbn
        },
        {
            $addToSet:{
                authors: req.body.newAuthor
            }
        },
        {
            new: true
        }
    );
    //update the author database
    const updateAuthor = await AuthorModel.findOneAndUpdate(
        {
            id: req.body.newAuthor
        },
        {
            $addToSet:{
                books:eq.params.isbn
            }
        },
        {
            new: true
        }
    );
    return res.json({books: database.books,
        authors: database.author,
        message: "New author was added"
    });
});
//UPDATE PUB AND BOOKS
/*
Route            /publication/update/book
Description      update the pub and the book
Access           PUBLIC
Parameter        NONE
Methods          PUT
*/

booky.put("/publication/update/book/:isbn", (req,res)=> {
    //UPDATE THE PUB DB
    database.publication.forEach((pub)=> {
        if(pub.id === req.body.pubId) {
            return pub.books.push(req.params.isbn);
        }
    });

    //UPDATE THE BOOK DB
    database.books.forEach((book)=> {
        if(book.ISBN == req.params.isbn) {
            book.publication = req.body.pubId;
            return;
        }
    });

    return res.json(
        {
            books: database.books,
            publication: database.publication,
            message: "Successfully updated Publication!!"
        }
    )

});

//DELETE A BOOK
/*
Route            /book/delete
Description      delete a book
Access           PUBLIC
Parameter        isbn
Methods          DELETE
*/

booky.delete("/book/delete/:isbn", async (req,res)=> {
    const updateBookDatabase = await BookModel.findOneAndDelete({
        ISBN: req.params.isbn
    });

    return res.json({books: updatedBookDatabase});
});

//dELETE AN AUTHOR FROM A BOOK AND VICE VERSA
/*
Route            /book/delete/author
Description      delete an author from a book and vise versa
Access           PUBLIC
Parameter        isbn, authorId
Methods          DELETE
*/

booky.delete("/book/delete/author/:isbn/:authorId", async (req,res)=> {
    //Update the books db
    const updatedBook = await BookModel.findOneUpdate(
        {
            ISBN: req.params.isbn
        },
        {
            $pull: {
                authors: parseInt(req.params.authorId)
            }
        },    
            {
                new: true
            }
    );
    //UPDATE AUTHOR DB
    database.author.forEach((eachAuthor)=> {
        if(eachAuthor.id === parseInt(req.params.authorId)) {
            const newBookList = eachAuthor.books.filter(
               (book) => book !== req.params.isbn
            );
            eachAuthor.books = newBookList;
            return;
        }
    });

    return res.json({
        book: database.books,
        author: database.author,
        message: "Author and books were deleted!!!"
    });

});

booky.listen(1000,() => console.log("Server is up and running!!"));
