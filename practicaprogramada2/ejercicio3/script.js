// Array para almacenar los productos
let products = [];

// Referencias a los elementos del DOM
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const filterCategory = document.getElementById('filter-category');

// Función para agregar un producto
function addProduct(event) {
    event.preventDefault(); // Evitar el envío del formulario

    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;

    // Crear un objeto producto
    const product = { name, price, category };
    products.push(product);

    // Limpiar el formulario
    productForm.reset();

    // Actualizar la lista de productos
    displayProducts();
}

// Función para mostrar los productos en el DOM
function displayProducts() {
    productList.innerHTML = ''; // Limpiar la lista

    const selectedCategory = filterCategory.value;

    products.forEach((product, index) => {
        // Filtrar por categoría
        if (selectedCategory === '' || product.category === selectedCategory) {
            const li = document.createElement('li');
            li.textContent = `${product.name} - ₡${product.price}`;
            
            // Botón para eliminar el producto
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.onclick = () => {
                products.splice(index, 1); // Eliminar el producto del array
                displayProducts(); // Actualizar la lista
            };

            li.appendChild(deleteButton);
            productList.appendChild(li);
        }
    });
}

// Evento para agregar un producto
productForm.addEventListener('submit', addProduct);

// Evento para filtrar productos
filterCategory.addEventListener('change', displayProducts);