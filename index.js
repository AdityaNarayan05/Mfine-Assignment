const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
const mongoAtlasConnectionString = process.env.URL;

// Connect to MongoDB Atlas
mongoose.connect(mongoAtlasConnectionString).then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB Atlas', err));
;

// Define the ParkingLot schema
const parkingLotSchema = new mongoose.Schema({
    slotNumber: Number,
    registrationNumber: String,
    color: String,
});

const ParkingLotModel = mongoose.model('ParkingLot', parkingLotSchema);

// Function to generate a unique ID for the parking lot
const generateParkingLotId = () => {
    return uuidv4();
};

// API to create a new parking lot
app.post('/api/parkingLots', async (req, res) => {
    try {
        const { id, capacity } = req.body;
        const existingParkingLot = await ParkingLotModel.findOne({ id });

        if (existingParkingLot) {
            return res.status(400).json({ isSuccess: false, error: 'Parking lot with this ID already exists.' });
        }
        const slots = Array.from({ length: capacity }, (_, index) => ({
            slotNumber: index + 1,
            registrationNumber: null,
            color: null,
        }));

        await ParkingLotModel.insertMany(slots);

        const response = {
            isSuccess: true,
            response: {
                id,
                capacity,
                isActive: true,
            },
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ isSuccess: false, error: 'Internal Server Error' });
    }
});
//api parking
app.post('/api/Parking', async (req, res) => {
    try {
        const { parkingLotId, registrationNumber, color } = req.body;
        const parkingLot = await ParkingLotModel.find({});
        if (!parkingLot) {
            return res.status(404).json({ error: 'Parking lot not found.' });
        }

        const availableSlot = parkingLot.find((car) => car.registrationNumber === null);
        if (!availableSlot) {
            return res.status(400).json({ isSuccess: false, error: 'Parking lot is full.' });
        }

        availableSlot.registrationNumber = registrationNumber;
        availableSlot.color = color;
        await availableSlot.save();
        const response = {
            isSuccess: true,
            response: {
                slotNumber: availableSlot.slotNumber,
                status: 'PARKED',
            },
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ isSuccess: false, error: 'Internal Server Error' });
    }
});


// API to leave/unpark a car
app.delete('/api/Parkings', async (req, res) => {
    try {
        const { parkingLotId, registrationNumber } = req.body;
        const parkingLot = await ParkingLotModel.find({});
        if (!parkingLot) {
            return res.status(404).json({ isSuccess: false, error: 'Parking lot not found.' });
        }
        const targetSlot = parkingLot.find((car) => car && car.registrationNumber === registrationNumber);

        if (!targetSlot) {
            return res.status(404).json({ isSuccess: false, error: 'Car not found in the parking lot.' });
        }

        registrationNumbera = targetSlot.registrationNumber;
        targetSlot.registrationNumber = null;
        targetSlot.color = null;
        await targetSlot.save();
        const response = {
            isSuccess: true,
            response: {
                slotNumber: targetSlot.slotNumber,
                registrationNumber: registrationNumbera,
                status: 'LEFT',
            },
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ isSuccess: false, error: 'Internal Server Error' });
    }
});

// API to get registration numbers of cars with a specific color
app.get('/registration_numbers_for_cars_with_color', (req, res) => {
    const { color: color } = req.query;
    const matchingCars = parkingLot.filter((car) => car && car.color === color);
    const registrationNumbers = matchingCars.map((car) => car.registration_number);
    res.json({ registration_numbers: registrationNumbers });
});

// API to get slot numbers for cars with a specific color
app.get('/slot_numbers_for_cars_with_color', (req, res) => {
    const { color: color } = req.query;
    const matchingSlots = parkingLot.reduce((acc, car, index) => {
        if (car && car.color === color) {
            acc.push(index + 1);
        }
        return acc;
    }, []);
    res.json({ slot_numbers: matchingSlots });
});

// Start the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () =>
    console.log(`Server started on ${port}`)
);