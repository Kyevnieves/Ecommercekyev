const pool = require("../database");
const { cloud, cloudinary } = require("../public/js/cloudinary");
const buscarPorTitulo = async (title) => {
  // CONVERSION PARA REALIZAR QUERY CORRECTAMENTE
  title = `%${title}%`;
  // CONVERSION PARA REALIZAR QUERY CORRECTAMENTE
  return await pool.query("SELECT * FROM productos WHERE title LIKE ?", [
    title,
  ]);
};
const buscarPorCategoria = async (category) => {
  return await pool.query("SELECT * FROM productos WHERE category = ?", [
    category,
  ]);
};
const buscarPorTituloYCategoria = async (title, category) => {
  title = `%${title}%`;
  return await pool.query(
    "SELECT * FROM productos WHERE category = ? && title LIKE ?",
    [category, title]
  );
};
const shop = async (req, res, next) => {
  // OBTENER CATEGORIAS DE PRODUCTOS
  let categorys = await pool.query("SELECT DISTINCT category FROM productos");
  let category = req.query.category;
  let title = req.query.title;
  // OBTENER TODOS LOS PRODUCTOS
  let product = await pool.query(`SELECT * FROM productos WHERE id <=10`);
  // OBTENER PRODUCTOS EN BASE A CATEGORIA Y TITULO EN QUERY
  category !== undefined && title !== undefined
    ? (product = await buscarPorTituloYCategoria(title, category))
    : next;
  // OBTENER PRODUCTOS EN BASE A CATEGORIA EN QUERY
  category !== undefined
    ? (product = await buscarPorCategoria(category))
    : next;
  // OBTENER PRODUCTOS EN BASE A TITULO EN QUERY
  title !== undefined ? (product = await buscarPorTitulo(title)) : next;
  res.render("shop", { product, categorys, title });
};

const shopPage2 = async (req, res) => {
  let categorys = await pool.query("SELECT DISTINCT category FROM productos");
  let inicia = 10;
  let termina = 20;
  let product = await pool.query(
    `SELECT * FROM productos WHERE id > ${inicia} && id <= ${termina};`
  );
  res.render("shop", { product, categorys });
};
const carrito = (req, res) => {
  res.render("shop/cart");
};
const checkout = (req, res) => {
  res.render("shop/checkout");
};
const obtenerProducto = async (req, res) => {
  const { id } = req.params;
  const product = await pool.query("SELECT * FROM productos WHERE id = ?", [
    id,
  ]);
  res.render("shop/view-product", { product });
};
const viewAgregarProducto = async (req, res) => {
  res.render("shop/admin/add-product");
};
const agregarProductoBD = async (req, res) => {
  const { title, price, description, category } = req.body;
  const filePath = req.file.path;
  const urlImg = await cloudinary.v2.uploader.upload(
    filePath,
    { public_id: "cloudinary" },
    function (error, result) {
      return result;
    }
  );
  const image = urlImg.url;
  const newProduct = {
    title,
    price,
    description,
    image,
    category,
  };
  const product = await pool.query("INSERT INTO productos set ?", [newProduct]);
  res.send("Producto creado exitosamente");
};
const viewEditarProducto = async (req, res) => {
  let { id } = req.params;
  const product = await pool.query("SELECT * FROM productos WHERE id = ?", [
    id,
  ]);
  res.render("shop/admin/edit-product", { product });
};
const editarProductoBD = async (req, res, next) => {
  const { id } = req.params;
  const { title, price, description, category } = req.body;
  var image = null;
  if (req.file !== undefined) {
    const filePath = req.file.path;
    const urlImg = await cloudinary.v2.uploader.upload(
      filePath,
      { public_id: "cloudinary" },
      function (error, result) {
        return result;
      }
    );
    image = urlImg.url;
  }
  await pool.query(
    "UPDATE productos SET title = IFNULL(?, title), price = IFNULL(?, price), description = IFNULL(?, description), category = IFNULL(?, category), image = IFNULL(?, image) WHERE id = ?",
    [title, price, description, category, image, id]
  );
  res.send("Producto actualizado");
};
module.exports = {
  carrito,
  checkout,
  shop,
  shopPage2,
  obtenerProducto,
  viewAgregarProducto,
  agregarProductoBD,
  viewEditarProducto,
  editarProductoBD,
};
