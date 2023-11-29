const { gql } = require("apollo-server");
const typeDefs = gql`
  type Usuario {
    id: ID
    nombre: String
    apellido: String
    email: String
    creado: String
  }

  type Tecnologia {
    tecnologia: String
  }

  input CursoInput {
    tecnologia: String
  }

  input UsuarioInput {
    nombre: String!
    apellido: String!
    email: String!
    password: String!
  }

  input AutenticarInput {
    email: String!
    password: String!
  }

  type Token {
    token: String
  }

  input ProductoInput {
    nombre: String!
    existencias: Int!
    precio: Float!
  }

  type Producto {
    id: ID
    nombre: String!
    existencias: Int!
    precio: Float!
    creado: String
  }

  type Pedido {
    id: ID
    pedido: [PedidoGrupo]
    total: Float
    cliente: ID
    vendedor: ID
    creado: String
    estado: EstadoPedido
  }

  type PedidoGrupo {
    id: ID
    cantidad: Int
  }

  input ClienteInput {
    nombre: String!
    apellido: String!
    empresa: String!
    email: String!
    telefono: String
  }

  input PedidoProductoInput {
    id: ID
    cantidad: Int
  }

  input PedidoInput {
    pedido: [PedidoProductoInput]
    total: Float
    cliente: ID
    estado: EstadoPedido
  }

  enum EstadoPedido {
    PENDIENTE
    COMPLETADO
    CANCELADO
  }

  type Cliente {
    id: ID
    nombre: String
    apellido: String
    empresa: String
    email: String
    telefono: String
    vendedor: String
  }

  type TopCliente {
    total: Float
    cliente: [Cliente]
  }

  type TopVendedor {
    total: Float
    vendedor: [Usuario]
  }

  type Query {
    obtenerUsuario(token: String!): Usuario
    obtenerUsuarios: [Usuario]
    obtenerProductos: [Producto]
    obtenerProducto(id: ID!): Producto
    obtenerClientes: [Cliente]
    obtenerClientesVendedor: [Cliente]
    obtenerCliente(id: ID!): Cliente

    # -- Pedidos --
    obtenerPedidosVendedor: [Pedido]
    obtenerPedidos: [Pedido]
    obtenerPedido(id: ID!): Pedido
    obtenerPedidoEstado(estado: EstadoPedido!) : [Pedido]

    # --- Busquedas Avanzadas ---
    mejoresClientes: [TopCliente]
    mejoresVendedores: [TopVendedor]
    buscarProducto(texto: String!): [Producto]
  }

  type Mutation {
    nuevoUsuario(input: UsuarioInput): Usuario
    autenticarUsuario(input: AutenticarInput): Token

    # -- Productos --
    crearProducto(input: ProductoInput): Producto
    actualizarProducto(id: ID!, input: ProductoInput): Producto
    eliminarProducto(id: ID!): String

    # -- Cliente --
    crearCliente(input: ClienteInput): Cliente
    actualizarCliente(id: ID!, input: ClienteInput): Cliente
    eliminarCliente(id: ID!): String

    # -- Pedidos --
    nuevoPedido(input: PedidoInput): Pedido
    actualizarPedido(id: ID!, input: PedidoInput): Pedido
    eliminarPedido(id: ID!): String


  }
`;

module.exports = typeDefs;
