const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { Room } = require("../../models/Rooms");

//getting Rooms
router.get("/", async (req, res) => {
  try {
    const room = await Room.find();

    //sending email to the client
    for (let index = 0; index < room.length; index++) {
      if (
        ((room[index].co2Level >= 5 && room[index].co2Level <= 10) ||
          (room[index].smokeLevel >= 5 && room[index].smokeLevel <= 10)) &&
        room[index].isAlarmActive === true &&
        room[index].user.isMailSent === false
      ) {
        let transporter = nodemailer.createTransport({
          host: "smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: "cd1d2b8d863288",
            pass: "41ff48f6db0ffa",
          },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
          from: "dinuka@gmail.com", // sender address
          to: room[index].user.userEmail, // list of receivers
          subject: "Item Approved", // Subject line
          text: "Hello world?", // plain text body
          html: `<h1>Hello</h1><br/>
                  <span><h3>Room No : ${room[index].roomNo}</h3></span>
                  <span>CO2 Level = ${room[index].co2Level}</span><br/>
                  <span>Smoke Level = ${room[index].smokeLevel}</span> `, // html body
        });

        transporter.sendMail(info, function (err, info) {
          if (err) {
            console.log(err);
          } else {
            console.log(info);
          }
        });
        room[index].user.isMailSent = true;
        await room[index].save();
      }
    }

    res.send(room);
    console.log(room);
  } catch (e) {
    console.log(e);
  }
});

router.put("/smsEmailStatus", async (req, res) => {
  try {
    const room = await Room.find();
    console.lo("excuted The put method");
    setTimeout(async function () {
      try {
        for (let index = 0; index < room.length; index++) {
          if (
            (room[index].co2Level >= 5 || room[index].co2Level <= 10) &&
            room[index].isAlarmActive
          ) {
            room[index].isMailSent = true;
            room[index].isSMSSent = true;
          } else {
            room[index].isMailSent = false;
            room[index].isSMSSent = false;
          }
        }
      } catch (error) {}
    }, 2000);

    const result = await room.save();
    res.send(result);
  } catch (error) {}
});

//addd new Rooms
//just to add users to no sql
router.post("/addroom", async (req, res) => {
  console.log(req.body);
  try {
    //destructuring the req body
    const {
      roomNo,
      floorNo,
      user,
      isAlarmActive,
      smokeLevel,
      co2Level,
    } = req.body;
    //checking whether the user with same room address exist

    let room = await Room.findOne({ roomNo });

    if (room) return res.status(400).send("Room already exists");

    room = new Room({
      roomNo,
      floorNo,
      user,
      isAlarmActive,
      smokeLevel,
      co2Level,
    });
    const result = await room.save();
    res.status(200).json(result);
  } catch (e) {
    res.send(e);
    console.log(e);
  }
});

//adding customers to the room
router.put("/addCustomer/:roomNo", async (req, res) => {
  try {
    //checking for the room existence
    //console.log(req);
    let room = await Room.findOne({ roomNo: req.params.roomNo });
    if (!room) return res.status(400).send("No Such Room exist");

    room.user.userNic = req.body.nic;
    room.user.userEmail = req.body.email;
    room.user.userMobile = req.body.mobile;

    room.isAlarmActive = true;

    await room.save();
    res.json(room);
  } catch (error) {
    res.send(error);
  }
});

//adding sensor details to the room
router.put("/addSensor/:roomNo", async (req, res) => {
  try {
    //checking for the room existence
    let room = await Room.findOne({ roomNo: req.params.roomNo });
    console.log(room);
    if (!room) return res.status(400).send("No Such Room exist");

    room.smokeLevel = req.body.smokeLevel;
    room.co2Level = req.body.co2Level;

    if (
      (room.co2Level >= 5 && room.co2Level <= 10) ||
      (room.smokeLevel >= 5 && room.smokeLevel <= 10)
    ) {
      room.user.isMailSent = false;
    }

    await room.save();
    res.json(room);
  } catch (error) {}
});

//get rooms with users
router.get("/withUsers", async (req, res) => {
  try {
    let room = await Room.find({ user: { $ne: null } });
    console.log(room);
    res.send(room);
  } catch (error) {
    res.send(error);
  }
});

//alert needed rooms
router.get("/alert", async (req, res) => {
  try {
    const room = await Room.find().or([
      { co2Level: { $gte: 5, $lt: 10 } },
      { smokeLevel: { $gte: 5, $lt: 10 } },
    ]);

    res.sendStatus(200).json(room);
    // console.log(room);
  } catch (e) {
    console.log(e);
  }
});

router.get("/alertUserInformation", async (req, res) => {});

module.exports = router;
