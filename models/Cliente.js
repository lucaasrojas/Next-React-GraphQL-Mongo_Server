const mongoose = require("mongoose");

const ClienteSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellido: {
    type: String,
    required: true,
    trim: true,
  },
  empresa: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  telefono: {
    type: String,
    required: false,
    trim: true,
  },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId, // ID del vendedor
    required: true,
    ref: "Usuario", // Referencia del schema
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Cliente", ClienteSchema);
