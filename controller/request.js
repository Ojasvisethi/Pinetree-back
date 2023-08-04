const Request = require("../models/request");

// Controller function to handle form submission
exports.send = async (req, res) => {
  try {
    const { name, email, message, mobileNumber } = req.body;
    // Save the form data to the database using the Request model
    // console.log(req.body);
    const requestData = new Request({
      name,
      email,
      message,
      mobileNumber,
    });

    await requestData.save();

    res.status(201).json({ message: "Form submitted successfully" });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ message: "Error submitting form" });
  }
};

exports.getRequest = async (req, res) => {
  try {
    const songs = await Request.find({}).lean(); // Use lean() to convert to plain JS objects
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching requests" });
  }
};
