const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const mongoAtlasConnectionString = process.env.URL;

mongoose.connect(mongoAtlasConnectionString)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB Atlas', err));

const parkingLotSchema = new mongoose.Schema({
    _id: String,
    capacity: Number,
});

const carSchema = new mongoose.Schema({
    parkingLotId: String,
    registrationNumber: String,
    color: String,
    slotNumber: Number,
    status: String, // Add status field to the schema
});

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);
const Car = mongoose.model('Car', carSchema);

app.post('/api/parkingLots', async (req, res) => {
    const { id, capacity } = req.body;
    // if(!id){
    //     return res.status(404).json({ error: 'invalid ID' });
    //   }
    //   if(!capacity){
    //     return res.status(404).json({ error: 'invalid capacity' });
    //   }
    // Validate capacity
    if (capacity < 0 || capacity > 2000 || !capacity) {
        return res.status(400).json({ isSuccess: false, error: 'Capacity should be between 0 and 2000.' });
    }

    // Validate id
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ isSuccess: false, error: 'Invalid id.' });
    }

    try {
        await ParkingLot.create({ _id: id, capacity });
        const response = {
            isSuccess: true,
            response: {
                id: id,
                capacity: capacity,
                isActive: true,
            },
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ isSuccess: false, error: error.message });
    }
});

app.post('/api/Parking', async (req, res) => {
    const { parkingLotId, registrationNumber, color, status } = req.body;

    // Validate registrationNumber
    if (!isValidRegistrationNumber(registrationNumber)) {
        return res.status(400).json({ isSuccess: false, error: 'Invalid registration number format.' });
    }

    // Validate status
    if (status !== 'PARKED' && status !== 'LEFT') {
        return res.status(400).json({ isSuccess: false, error: 'Invalid status. It should be either PARKED or LEFT.' });
    }

    // Validate color
    const allowedColors = ['RED', 'GREEN', 'BLUE', 'BLACK', 'WHITE', 'YELLOW', 'ORANGE'];
    if (!allowedColors.includes(color)) {
        return res.status(400).json({ isSuccess: false, error: 'Invalid color.' });
    }

    try {
        const parkingLot = await ParkingLot.findById(parkingLotId);
        if (!parkingLot) {
            return res.status(404).json({ error: 'Parking lot not found.' });
        }

        const slotNumber = await Car.countDocuments({ parkingLotId }) + 1;
        if (slotNumber > parkingLot.capacity) {
            return res.status(400).json({ isSuccess: false, error: 'Parking lot is full.' });
        }

        await Car.create({ parkingLotId, registrationNumber, color, slotNumber, status });
        const response = {
            isSuccess: true,
            response: {
                slotNumber: slotNumber,
                status: 'PARKED',
            },
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ isSuccess: false, error: error.message });
    }
});

app.delete('/api/Parkings', async (req, res) => {
    const { parkingLotId, registrationNumber } = req.body;

    try {
        const car = await Car.findOneAndDelete({ parkingLotId, registrationNumber });

        if (!car) {
            return res.status(404).json({ isSuccess: false, error: 'Car not found in the parking lot.' });
        }

        const response = {
            isSuccess: true,
            response: {
                slotNumber: car.slotNumber,
                registrationNumber: car.registrationNumber,
                status: 'LEFT',
            },
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ isSuccess: false, error: error.message });
    }
});

app.get('/api/Parkings', async (req, res) => {
    const { color, parkingLotId } = req.query;

    try {
        const matchingCars = await Car.find({ parkingLotId, color });

        if (matchingCars.length === 0) {
            return res.status(400).json({ isSuccess: false, error: { reason: `No car found with color ${color}` } });
        }

        const registrations = matchingCars.map((car) => ({
            color: car.color,
            registrationNumber: car.registrationNumber,
        }));

        const response = {
            isSuccess: true,
            response: {
                registrations: registrations,
            },
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ isSuccess: false, error: error.message });
    }
});

app.get('/api/Slots', async (req, res) => {
    const { color, parkingLotId } = req.query;

    try {
        const parkingLot = await ParkingLot.findById(parkingLotId);

        if (!parkingLot) {
            return res.status(404).json({ isSuccess: false, error: 'Parking lot not found.' });
        }

        const matchingSlots = await Car.find({ parkingLotId, color })
            .sort({ slotNumber: 1 })
            .select('color slotNumber -_id');

        if (matchingSlots.length === 0) {
            return res.status(400).json({ isSuccess: false, error: { reason: 'Invalid Color' } });
        }

        const response = {
            isSuccess: true,
            response: {
                slots: matchingSlots.map((slot) => ({
                    color: slot.color,
                    slotNumber: slot.slotNumber,
                })),
            },
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ isSuccess: false, error: error.message });
    }
});

function isValidRegistrationNumber(registrationNumber) {
    if (typeof registrationNumber !== 'string') {
        return false;
    }

    if (registrationNumber.length !== 9) {
        return false;
    }

    const districtCode = registrationNumber.substring(0, 2);
    const validDistrictCodes = ['DL', 'MH', 'KA', 'TN'];

    if (!validDistrictCodes.includes(districtCode)) {
        return false;
    }

    const remainingCharacters = registrationNumber.substring(2);
    const validFormat = /^[A-Z0-9]+$/.test(remainingCharacters);

    return validFormat;
}

const port = process.env.PORT || 5000;
const server = app.listen(port, () =>
    console.log(`Server started on ${port}`)
);