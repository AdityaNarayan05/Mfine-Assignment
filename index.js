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
app.post('/api/parkingLots', (req, res) => {
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

//API to park a car 
app.post('/api/parking', (req, res) => {
    const { parkingLotId, registrationNumber, color } = req.body;
    const parkingLot = parkingLots[parkingLotId];

    if (!parkingLot) {
        return res.status(404).json({ error: 'Parking lot not found.' });
    }

    const slotNumber = parkingLot.indexOf(null) + 1;

    if (slotNumber === 0 || slotNumber > parkingLot.length) {
        return res.status(400).json({ isSuccess: false, error: 'Parking lot is full.' });
    }

    parkingLot[slotNumber - 1] = { registrationNumber, color };
    const response = {
        isSuccess: true,
        response: {
            slotNumber: slotNumber,
            status: 'PARKED',
        },
    };

    res.json(response);
});

//API to leave/unpark a car from the parking lot

app.post('/leave', (req, res) => {
    const { slot_number } = req.body;
    if (slot_number < 1 || slot_number > parkingLot.length) {
        return res.status(400).json({ error: 'Invalid slot number.' });
    }

    parkingLot[slot_number - 1] = null;
    res.json({ message: `Slot ${ slot_number } is now available.` });
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});