const express=require('express');
const http=require('http');
const socketIO=require('socket.io');
const mongoose=require('mongoose');
// const routes=require("./routers");
const app=express();
const server=http.createServer(app);
const io=socketIO(server);
const bodyparser=require('body-parser');
var cors=require('cors');
var path=require('path');

const URL='mongodb://127.0.0.1:27017/chartapp';
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.use(cors());
mongoose
  .connect(URL, {
    useNewURLParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));


const schema=new mongoose.Schema({
    title:String,
    labels:{type:[String],required:true},
    data:{type:[Number],required:true}
});

const DATA=mongoose.model('DATA',schema);

io.on('connection',(socket)=>{
    console.log('New client connected');

    DATA.find().then((data)=>{
        socket.emit('data',data);
    }).catch((err)=>{
        console.log('Error fetching data from MongoDB: ',err);
    });

    socket.on('create', (data)=>{
        DATA.create(data).then((newDATA)=>{
            io.emit('dataCreated',newDATA);
        }).catch((err)=>{
            console.log('Error creating data in the MongoDB: ',err);
        });
    });

    socket.on('update',(id, newDATA)=>{
        DATA.findByIdAndUpdate(id, newDATA,{new: true})
        .then((updateDATA)=>{
            io.emit('dataUpdated',updateDATA);
        })
        .catch((err)=>{
            console.log('Error updating data in MongoDB: ',err);
        });
    });

    socket.on('delete',(id)=>{
        DATA.findByIdAndDelete(id)
        .then((deleteDATA)=>{
            io.emit('dataDeleted',deleteDATA);
        })
        .catch((err)=>{
            console.log('Error deleting data from MongoDB: ',err);
        });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

app.get('/data',(req,resp)=>{
    console.log('Received Get Request got /data');
    DATA.find()
    .then((data) => {
        console.log("data fetched successfully:",data);
      resp.status(200).json(data);
    })
    .catch((err) => {
      console.log('Error fetching data from MongoDB: ', err);
      resp.status(500).json({ error: 'Error fetching data' });
    });
});

// app.post('/add',(req,resp)=>{
//     console.log("In Post Method");
//     var createData=new DATA({title:req.body.title,labels:[req.body.labels],data:[req.body.data]});

//     createData.save().then((data)=>{
//         console.log("Data added successfully: ",data);
//         // resp.status(201).send("Added");
//     }).catch((err)=>{
//         console.log("Error occured",err);
//         resp.status(501).send("Server not supported");
//     });
// });

app.post('/add', async (req, resp) => {
    console.log("In Post Method");
  
    try {
      const createData = new DATA({
        title: req.body.title,
        labels: req.body.labels,
        data: req.body.data
      });
  
      const savedData = await createData.save();
      console.log("Data added successfully: ", savedData);
      resp.status(201).send("Added");
    } catch (err) {
      console.log("Error occurred", err);
      resp.status(501).send("Server not supported");
    }
  });
  

app.put('/edit/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const newData = {
        title: req.body.title,
        labels: req.body.labels,
        data: req.body.data
      };
  
      const updatedData = await DATA.findByIdAndUpdate(id, newData, { new: true });
  
      if (!updatedData) {
        return res.status(404).json({ error: 'Data not found' });
      }
  
      io.emit('dataUpdated', updatedData);
      res.status(200).json(updatedData);
    } catch (err) {
      console.log('Error updating data in MongoDB: ', err);
      res.status(500).json({ error: 'Error updating data' });
    }
  });

  // Assuming you have already set up the required imports and the MongoDB schema (DATA) and the server (app) as shown in your previous code...

// Route to delete data based on a specific label using HTTP DELETE
app.delete('/deletelabels/:label', async (req, res) => {
    try {
      const labelToDelete = req.params.label;
  
      const deletedData = await DATA.deleteMany({ labels: labelToDelete });
  
      if (deletedData.deletedCount === 0) {
        return res.status(404).json({ error: 'No data found with the specified label' });
      }
  
      io.emit('dataDeleted', labelToDelete);
      res.status(200).json({ message: `Data with label "${labelToDelete}" deleted successfully` });
    } catch (err) {
      console.log('Error deleting data by label in MongoDB: ', err);
      res.status(500).json({ error: 'Error deleting data by label' });
    }
  });
  
  // Assuming you have already set up the required imports and the MongoDB schema (DATA) and the server (app) as shown in your previous code...

// Route to delete data based on a specific ID using HTTP DELETE
app.delete('/delete/:id', async (req, res) => {
    try {
      const idToDelete = req.params.id;
  
      const deletedData = await DATA.findByIdAndDelete(idToDelete);
  
      if (!deletedData) {
        return res.status(404).json({ error: 'No data found with the specified ID' });
      }
  
      io.emit('dataDeleted', deletedData);
      res.status(200).json({ message: `Data with ID "${idToDelete}" deleted successfully` });
    } catch (err) {
      console.log('Error deleting data by ID in MongoDB: ', err);
      res.status(500).json({ error: 'Error deleting data by ID' });
    }
  });
  



server.listen(4000,()=>{
    console.log('server is running on http://localhost:4000');
});

