const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');


const app = express();
app.use(bodyParser.json());
require('dotenv').config();

const port = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("DB Connection Success-full");
    })
    .catch((err) => {
        console.log(err.message);
    });

    let parkingLots = {};
    // Function to generate a unique ID for the parking lot
    const generateParkingLotId = () => {
        return uuidv4();
    };

    //API  to create a new parking lot 
    app.post('/api/parkingLots',(req,res)=>{
        const { capacity } = req.body;
        const parkingLotId = generateParkingLotId();
        
        parkingLots[parkingLotId] = new Array(capacity).fill(null);
        const response = {
            isSuccess: true,
            response: {
                id: parkingLotId,
                capacity: capacity,
                isActive: true,
            },
        };
        
        res.json(response);
    })



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});