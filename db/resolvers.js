const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
const crearToken = (usuario, secreta, expiracion) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    secreta,
    { expiresIn: expiracion }
  );
};
const getOrder = async (id) => {
  const order = await Pedido.findById(id);
  if (!order) throw new Error("Pedido no encontrado");
  return order;
};

const getClient = async () => {
  const client = await Cliente.findById(input.cliente);
  if (!client) throw new Error("Cliente no encontrado");
  return client;
};
// Resolvers
const resolvers = {
  Query: {
    // --- Usuarios ---
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = await jwt.verify(token, process.env.SECRETA);
      return usuarioId;
    },
    obtenerUsuarios: async () => {
      try {
        const usuarios = await Usuario.find({});
        return usuarios;
      } catch (error) {
        console.log("ERROR: obtenerUsuarios");
      }
    },

    // --- Productos ---
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (error) { }
    },
    obtenerProducto: async (_, { id }) => {
      try {
        const producto = await Producto.findById(id);

        return producto;
      } catch (error) {
        throw new Error("producto no encontrado");
      }
    },

    // --- Clientes ---
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (error) {
        console.log("Error: obtenerClientes");
      }
    },
    obtenerClientesVendedor: async (_, { }, ctx) => {
      console.log(ctx);
      try {
        const clientes = await Cliente.find({
          vendedor: ctx.usuario.id.toString(),
        });
        console.log("Clientes", clientes);
        return clientes;
      } catch (error) {
        console.log("Error: obtenerClientesVendedor");
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      // Validar que existe el cliente
      const cliente = await Cliente.findById(id);
      if (!cliente) throw new Error("Cliente no encontrado");
      // Solo puede verlo el que lo creo
      if (cliente.vendedor.toString() !== ctx.usuario.id)
        throw new Error("No tienes las credenciales");

      return cliente;
    },

    // Pedidos
    obtenerPedidosVendedor: async (_, { }, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
      return pedidos;
    },
    obtenerPedidos: async () => {
      return await Pedido.find({});
    },
    obtenerPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) throw new Error("Pedido no encontrado");

      if (pedido.vendedor !== ctx.usuario.id)
        throw new Error("No tienen las credenciales necesarias");

      return pedido;
    },
    obtenerPedidoEstado: async (_, { estado }, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado: estado })

      return pedidos
    },

    mejoresClientes: async () => {
      // Las aggregate toma varios valores, muchas operaciones pero devuelve un solo reustlado
      const clientes = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$cliente",
            total: { $sum: '$total' }
          }
        },
        {
          $lookup: {
            from: 'clientes', // es el nombre del modelo de donde se saca la info
            localField: "_id",
            foreignField: "_id",
            as: "cliente"
          }
        },
        {
          $limit: 5
        },
        {
          $sort: {
            total: -1 // Ordena en descendente
          }
        }
      ])

      return clientes;
    },

    mejoresVendedores: async () => {
      // Las aggregate toma varios valores, muchas operaciones pero devuelve un solo reustlado
      const vendedores = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$vendedor",
            total: { $sum: '$total' }
          }
        },
        {
          $lookup: { // Es como un inner join
            from: 'usuarios', // es el nombre del modelo de donde se saca la info
            localField: "_id",
            foreignField: "_id",
            as: "vendedor"
          }
        },
        {
          $limit: 5
        },
        {
          $sort: {
            total: -1 // Ordena en descendente
          }
        }
      ])

      return vendedores;
    },
    buscarProducto: async (_, { texto }) => {
      // Usa el indice seteado en el modelo
      const productos = await Producto.find({ $text: { $search: texto } })
      return productos
    }
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const existe = await Usuario.findOne({ email: input.email });
      if (existe) throw new Error("El usuario ya está registrado");
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(input.password, salt);
      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) { }
    },
    autenticarUsuario: async (_, { input }) => {
      console.log("input", input)
      const existe = await Usuario.findOne({ email: input.email });

      if (!existe) throw new Error("El usuario no existe");

      const passwordCorrecto = await bcryptjs.compare(
        input.password,
        existe.password
      );

      if (!passwordCorrecto) throw new Error("El password es incorrecto");

      return {
        token: crearToken(existe, process.env.SECRETA, "24h"),
      };
    },
    crearProducto: async (_, { input }) => {
      const existeProducto = await Producto.findOne({ nombre: input.nombre });
      if (existeProducto) throw new Error("El producto ya existe");
      try {
        const nuevoProducto = new Producto(input);
        nuevoProducto.save();
        return nuevoProducto;
      } catch (error) { }
    },
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id);
      if (!producto) throw new Error("El producto no existe");

      producto = await Producto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return producto;
    },
    eliminarProducto: async (_, { id }) => {
      let producto = await Producto.findById(id);
      if (!producto) throw new Error("El producto no existe");

      await Producto.findOneAndDelete({ _id: id });

      return "Producto eliminado";
    },
    crearCliente: async (_, { input }, ctx) => {
      // Verificar si esta registreado
      const cliente = await Cliente.findOne({ email: input.email });
      if (cliente) throw new Error("Cliente ya registrado");
      // Guardar en DB
      try {
        const nuevoCliente = new Cliente(input);
        nuevoCliente.vendedor = ctx.usuario.id; // Agarro el ID del current user para asignarlo como vendedor
        const clienteGuardado = await nuevoCliente.save();
        return clienteGuardado;
      } catch (error) { }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      const cliente = await Cliente.findById(id);
      if (!cliente) throw new Error("cliente no encontrado");

      // Solo puede editarlo el que lo creo
      if (cliente.vendedor.toString() !== ctx.usuario.id)
        throw new Error("No tienes las credenciales");

      const clienteActualizado = await Cliente.findOneAndUpdate(
        { _id: id },
        input,
        { new: true }
      );

      return clienteActualizado;
    },
    eliminarCliente: async (_, { id }, ctx) => {
      const cliente = await Cliente.findById(id);
      if (!cliente) throw new Error("cliente no encontrado");

      // Solo puede editarlo el que lo creo
      if (cliente.vendedor.toString() !== ctx.usuario.id)
        throw new Error("No tienes las credenciales");

      await Cliente.findOneAndDelete({ _id: id });
      return "Cliente eliminado";
    },
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;
      // Verificar si el cliente existe
      let clienteExiste = await Cliente.findById(cliente);
      console.log("cliente existe", clienteExiste);
      if (!clienteExiste) throw new Error("Cliente no encontrado");
      // Verificar si el cliente es del vendedor
      if (clienteExiste.vendedor.toString() !== ctx.usuario.id)
        throw new Error("No tienes las credenciales");
      // Revisar que el stock este disponible
      // el for await es asyncrono, el forEach es sincrono
      for await (const articulo of input.pedido) {
        const { id } = articulo;
        const producto = await Producto.findById(id);
        if (articulo.cantidad > producto.existencias)
          throw new Error(
            `El articulo: ${producto.nombre} excede la cantidad disponible`
          );
        else {
          // Restar la cantidad a lo disponible
          producto.existencias = producto.existencias - articulo.cantidad;
          await producto.save();
        }
      }

      // TODO: Revisar si el total lo deberia calcular automaticamente

      // Crear un nuevo pedido
      const nuevoPedido = new Pedido(input);
      // Asignarle un vendedor
      nuevoPedido.vendedor = ctx.usuario.id;
      // Guardarlo en la DB
      const pedidoGuardado = await nuevoPedido.save();
      return pedidoGuardado;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      // Pedido existe
      const pedido = await getOrder(id);
      // Cliente existe
      const cliente = await getClient(input.cliente);
      // Cliente y pedido pertenece a vendedor
      if (
        cliente.vendedor.toString() !== ctx.usuario.id ||
        pedido.vendedor.toString() !== ctx.usuario.id
      )
        throw new Error("No tienen las credenciales");
      // Revisar stock para nuevo pedido
      if (input.pedido) {
        // TODO: Revisar que pasa si en el medio falla
        for await (const articulo of input?.pedido) {
          const producto = await Producto.findById(articulo.id);
          if (articulo.cantidad > producto.existencias)
            throw new Error(
              `El articulo: ${producto.nombre} excede la cantidad disponible`
            );
          else {
            // Restar la cantidad a lo disponible
            producto.existencias = producto.existencias - articulo.cantidad;
            await producto.save();
          }
        }
      }
      // Guardar el pedido
      return await Pedido.findOneAndUpdate({ _id: id }, input, { new: true });
    },
    eliminarPedido: async (_, { id }, ctx) => {
      try {
        const order = await getOrder(id);
        if (order.vendedor.toString() !== ctx.usuario.id)
          throw new Error("No tienes las credenciales");

        await Pedido.findOneAndDelete({ _id: id });
        return "Pedido eliminado";
      } catch (error) { }
    },
  },
};

module.exports = resolvers;
