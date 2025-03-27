document.addEventListener("DOMContentLoaded", () => {
  // References to DOM elements
  const categoriesContainer = document.getElementById("categories-container")
  const productsContainer = document.getElementById("products-container")
  const searchInput = document.getElementById("search-input")
  const cartItemsContainer = document.getElementById("cart-items")
  const cartTotalElement = document.getElementById("cart-total")
  const cartCountElement = document.getElementById("cart-count")
  const clearCartButton = document.getElementById("clear-cart")
  const requestQuoteButton = document.getElementById("request-quote")
  const filterButtons = document.querySelectorAll(".filter-button")

  // API URL base
  const API_URL = "http://localhost:3000/api"

  // Cart state
  let cart = []

  // Load cart from localStorage if exists
  const loadCart = () => {
    const savedCart = localStorage.getItem("alitoCart")
    if (savedCart) {
      cart = JSON.parse(savedCart)
      updateCartUI()
    }
  }

  // Save cart to localStorage
  const saveCart = () => {
    localStorage.setItem("alitoCart", JSON.stringify(cart))
  }

  // Update cart UI
  const updateCartUI = () => {
    // Update cart count in header
    if (cartCountElement) {
      cartCountElement.textContent = cart.length
      cartCountElement.style.display = cart.length > 0 ? "flex" : "none"
    }

    // If we're on the cart page, update the cart items
    if (cartItemsContainer) {
      renderCartItems()
    }
  }

  // Render cart items
  const renderCartItems = () => {
    if (!cartItemsContainer) return

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Su carrito de cotización está vacío</p>
          <a href="catalogo.html" class="boton-cta">
            <span>Ver Catálogo</span>
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      `
      cartTotalElement.textContent = "0.00"
      return
    }

    let total = 0
    cartItemsContainer.innerHTML = ""

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal

      const cartItemElement = document.createElement("div")
      cartItemElement.className = "cart-item"
      cartItemElement.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <p class="cart-item-category">${item.category}</p>
          <div class="cart-item-price">$${item.price.toFixed(2)} / ${item.unit}</div>
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn decrease" data-index="${index}">-</button>
          <div class="quantity-input-container">
            <input type="number" min="1" value="${item.quantity}" class="quantity-input" data-index="${index}">
            <span class="unit-label">${item.unit}</span>
          </div>
          <button class="quantity-btn increase" data-index="${index}">+</button>
        </div>
        <div class="cart-item-subtotal">
          $${itemTotal.toFixed(2)}
        </div>
        <button class="remove-item-btn" data-index="${index}">
          <i class="fas fa-trash-alt"></i>
        </button>
      `

      cartItemsContainer.appendChild(cartItemElement)
    })

    // Update total
    cartTotalElement.textContent = total.toFixed(2)

    // Add event listeners to cart item buttons
    document.querySelectorAll(".quantity-btn.decrease").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number.parseInt(btn.getAttribute("data-index"))
        if (cart[index].quantity > 1) {
          cart[index].quantity--
          saveCart()
          renderCartItems()
        }
      })
    })

    document.querySelectorAll(".quantity-btn.increase").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number.parseInt(btn.getAttribute("data-index"))
        cart[index].quantity++
        saveCart()
        renderCartItems()
      })
    })

    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("change", () => {
        const index = Number.parseInt(input.getAttribute("data-index"))
        const value = Number.parseInt(input.value)
        if (value > 0) {
          cart[index].quantity = value
        } else {
          input.value = 1
          cart[index].quantity = 1
        }
        saveCart()
        renderCartItems()
      })
    })

    document.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number.parseInt(btn.getAttribute("data-index"))
        cart.splice(index, 1)
        saveCart()
        updateCartUI()
      })
    })
  }

  // Add item to cart
  const addToCart = (product, quantity, unit) => {
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex((item) => item.id === product.id && item.unit === unit)

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      cart[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: quantity,
        unit: unit,
      })
    }

    // Save cart and update UI
    saveCart()
    updateCartUI()

    // Show success message
    showNotification("Producto agregado al carrito", "success")
  }

  // Show notification
  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === "success" ? "fa-check-circle" : "fa-info-circle"}"></i>
        <p>${message}</p>
      </div>
      <button class="close-notification">
        <i class="fas fa-times"></i>
      </button>
    `

    document.body.appendChild(notification)

    // Add event listener to close button
    notification.querySelector(".close-notification").addEventListener("click", () => {
      notification.classList.add("closing")
      setTimeout(() => {
        notification.remove()
      }, 300)
    })

    // Auto close after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add("closing")
        setTimeout(() => {
          notification.remove()
        }, 300)
      }
    }, 3000)

    // Animate in
    setTimeout(() => {
      notification.classList.add("show")
    }, 10)
  }

  // Fetch and render categories
  const fetchCategories = async () => {
    if (!categoriesContainer) return

    try {
      // In a real application, this would be fetched from the server
      const categories = [
        { id: 1, name: "Materiales", icon: "fa-layer-group" },
        { id: 2, name: "Maquinaria/Equipos", icon: "fa-truck-monster" },
        { id: 3, name: "Servicios", icon: "fa-tools" },
        { id: 4, name: "Traslado", icon: "fa-truck-loading" },
      ]

      categories.forEach((category) => {
        const categoryElement = document.createElement("div")
        categoryElement.className = "category-card"
        categoryElement.setAttribute("data-category", category.name)
        categoryElement.innerHTML = `
          <div class="category-icon">
            <i class="fas ${category.icon}"></i>
          </div>
          <h3>${category.name}</h3>
        `

        categoryElement.addEventListener("click", () => {
          // Remove active class from all categories
          document.querySelectorAll(".category-card").forEach((el) => {
            el.classList.remove("active")
          })

          // Add active class to clicked category
          categoryElement.classList.add("active")

          // Filter products by category
          filterProducts(category.name)
        })

        categoriesContainer.appendChild(categoryElement)
      })

      // Set first category as active
      categoriesContainer.querySelector(".category-card").classList.add("active")
      filterProducts(categories[0].name)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // Filter products by category
  const filterProducts = (category) => {
    if (!productsContainer) return

    // In a real application, this would filter products from the server
    fetchProducts(category)
  }

  // Fetch and render products
  const fetchProducts = async (category) => {
    if (!productsContainer) return

    try {
      // Show loading state
      productsContainer.innerHTML = `
        <div class="loading-products">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      `

      // In a real application, this would be fetched from the server
      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Sample products data
      const allProducts = [
        // Materiales
        {
          id: 1,
          name: "Arena Gruesa",
          description: "Arena gruesa para construcción de alta calidad.",
          price: 450,
          image: "/placeholder.svg?height=200&width=300",
          category: "Materiales",
          units: ["m³", "Camión"],
        },
        {
          id: 2,
          name: "Grava",
          description: "Grava para construcción y drenajes.",
          price: 520,
          image: "/placeholder.svg?height=200&width=300",
          category: "Materiales",
          units: ["m³", "Camión"],
        },
        {
          id: 3,
          name: "Cemento Portland",
          description: "Cemento de alta resistencia para construcciones.",
          price: 350,
          image: "/placeholder.svg?height=200&width=300",
          category: "Materiales",
          units: ["Saco", "Tonelada"],
        },

        // Maquinaria/Equipos
        {
          id: 4,
          name: "Excavadora",
          description: "Excavadora para movimiento de tierra y excavaciones.",
          price: 1200,
          image: "/placeholder.svg?height=200&width=300",
          category: "Maquinaria/Equipos",
          units: ["Hora", "Día", "Semana"],
        },
        {
          id: 5,
          name: "Retroexcavadora",
          description: "Retroexcavadora para trabajos de excavación y carga.",
          price: 950,
          image: "/placeholder.svg?height=200&width=300",
          category: "Maquinaria/Equipos",
          units: ["Hora", "Día", "Semana"],
        },
        {
          id: 6,
          name: "Montacargas",
          description: "Montacargas para elevación y transporte de materiales.",
          price: 750,
          image: "/placeholder.svg?height=200&width=300",
          category: "Maquinaria/Equipos",
          units: ["Hora", "Día", "Semana"],
        },

        // Servicios
        {
          id: 7,
          name: "Excavación de Terreno",
          description: "Servicio de excavación y preparación de terrenos.",
          price: 1800,
          image: "/placeholder.svg?height=200&width=300",
          category: "Servicios",
          units: ["m²", "Proyecto"],
        },
        {
          id: 8,
          name: "Limpieza de Obra",
          description: "Servicio de limpieza y remoción de escombros.",
          price: 1200,
          image: "/placeholder.svg?height=200&width=300",
          category: "Servicios",
          units: ["m²", "Proyecto"],
        },

        // Traslado
        {
          id: 9,
          name: "Camión 22 M3",
          description: "Transporte de materiales en camión de gran capacidad.",
          price: 850,
          image: "/placeholder.svg?height=200&width=300",
          category: "Traslado",
          units: ["Viaje", "Día"],
        },
        {
          id: 10,
          name: "Camión 16 M3",
          description: "Transporte de materiales en camión de capacidad media.",
          price: 700,
          image: "/placeholder.svg?height=200&width=300",
          category: "Traslado",
          units: ["Viaje", "Día"],
        },
      ]

      // Filter products by category
      const products =
        category === "Todos" ? allProducts : allProducts.filter((product) => product.category === category)

      // Check if there are products
      if (products.length === 0) {
        productsContainer.innerHTML = `
          <div class="no-products">
            <i class="fas fa-exclamation-circle"></i>
            <p>No se encontraron productos en esta categoría</p>
          </div>
        `
        return
      }

      // Render products
      productsContainer.innerHTML = ""

      products.forEach((product) => {
        const productElement = document.createElement("div")
        productElement.className = "product-card"
        productElement.innerHTML = `
          <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-overlay">
              <a href="detalle-producto.html?id=${product.id}" class="view-details-btn">
                <i class="fas fa-eye"></i> Ver Detalles
              </a>
            </div>
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-category">${product.category}</p>
            <p class="product-description">${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
          </div>
          <div class="product-actions">
            <div class="unit-selector">
              <select class="unit-select">
                ${product.units.map((unit) => `<option value="${unit}">${unit}</option>`).join("")}
              </select>
            </div>
            <div class="quantity-selector">
              <button class="quantity-btn decrease">-</button>
              <input type="number" min="1" value="1" class="quantity-input">
              <button class="quantity-btn increase">+</button>
            </div>
            <button class="add-to-cart-btn" data-product-id="${product.id}">
              <i class="fas fa-cart-plus"></i> Agregar
            </button>
          </div>
        `

        // Add event listeners for quantity buttons
        const quantityInput = productElement.querySelector(".quantity-input")

        productElement.querySelector(".quantity-btn.decrease").addEventListener("click", () => {
          if (Number.parseInt(quantityInput.value) > 1) {
            quantityInput.value = Number.parseInt(quantityInput.value) - 1
          }
        })

        productElement.querySelector(".quantity-btn.increase").addEventListener("click", () => {
          quantityInput.value = Number.parseInt(quantityInput.value) + 1
        })

        // Add event listener for add to cart button
        productElement.querySelector(".add-to-cart-btn").addEventListener("click", () => {
          const productId = Number.parseInt(
            productElement.querySelector(".add-to-cart-btn").getAttribute("data-product-id"),
          )
          const quantity = Number.parseInt(productElement.querySelector(".quantity-input").value)
          const unit = productElement.querySelector(".unit-select").value

          // Find product in products array
          const product = products.find((p) => p.id === productId)

          if (product) {
            addToCart(product, quantity, unit)
          }
        })

        productsContainer.appendChild(productElement)
      })
    } catch (error) {
      console.error("Error fetching products:", error)
      productsContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error al cargar los productos. Intente nuevamente.</p>
        </div>
      `
    }
  }

  // Search products
  const searchProducts = (query) => {
    if (!productsContainer) return

    // Get active category
    const activeCategory = document.querySelector(".category-card.active")
    const category = activeCategory ? activeCategory.getAttribute("data-category") : "Todos"

    // In a real application, this would search products from the server
    // For now, we'll just filter the products we have
    fetchProducts(category, query)
  }

  // Load product details
  const loadProductDetails = async () => {
    const productDetailContainer = document.getElementById("product-detail-container")
    if (!productDetailContainer) return

    try {
      // Get product ID from URL
      const urlParams = new URLSearchParams(window.location.search)
      const productId = Number.parseInt(urlParams.get("id"))

      if (!productId) {
        productDetailContainer.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Producto no encontrado</p>
            <a href="catalogo.html" class="boton-cta">
              <span>Volver al Catálogo</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        `
        return
      }

      // Show loading state
      productDetailContainer.innerHTML = `
        <div class="loading-product">
          <div class="spinner"></div>
          <p>Cargando detalles del producto...</p>
        </div>
      `

      // In a real application, this would be fetched from the server
      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Sample product data (same as in fetchProducts)
      const allProducts = [
        // Materiales
        {
          id: 1,
          name: "Arena Gruesa",
          description: "Arena gruesa para construcción de alta calidad.",
          price: 450,
          image: "/placeholder.svg?height=200&width=300",
          category: "Materiales",
          units: ["m³", "Camión"],
          details: {
            specifications: [
              "Granulometría: 0.5 - 2mm",
              "Densidad: 1,500 kg/m³",
              "Origen: Río local",
              "Limpia y libre de impurezas",
            ],
            applications: [
              "Preparación de concreto",
              "Morteros para mampostería",
              "Rellenos y nivelaciones",
              "Base para pavimentos",
            ],
            delivery: "Entrega disponible en toda la ciudad y alrededores. Tiempo estimado de entrega: 24-48 horas.",
          },
        },
        // Add other products here...
        {
          id: 2,
          name: "Grava",
          description: "Grava para construcción y drenajes.",
          price: 520,
          image: "/placeholder.svg?height=200&width=300",
          category: "Materiales",
          units: ["m³", "Camión"],
          details: {
            specifications: [
              "Tamaño: 10-20mm",
              "Densidad: 1,600 kg/m³",
              "Origen: Cantera local",
              "Alta resistencia a la compresión",
            ],
            applications: [
              "Preparación de concreto",
              "Sistemas de drenaje",
              "Decoración de jardines",
              "Base para construcciones",
            ],
            delivery: "Entrega disponible en toda la ciudad y alrededores. Tiempo estimado de entrega: 24-48 horas.",
          },
        },
        // Add more products as needed
      ]

      // Find product by ID
      const product = allProducts.find((p) => p.id === productId)

      if (!product) {
        productDetailContainer.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Producto no encontrado</p>
            <a href="catalogo.html" class="boton-cta">
              <span>Volver al Catálogo</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        `
        return
      }

      // Render product details
      productDetailContainer.innerHTML = `
        <div class="product-detail">
          <div class="product-detail-image">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="product-detail-info">
            <h1>${product.name}</h1>
            <div class="product-detail-category">${product.category}</div>
            <div class="product-detail-price">$${product.price.toFixed(2)}</div>
            <p class="product-detail-description">${product.description}</p>
            
            <div class="product-detail-actions">
              <div class="unit-selector">
                <label for="unit-select">Unidad:</label>
                <select id="unit-select" class="unit-select">
                  ${product.units.map((unit) => `<option value="${unit}">${unit}</option>`).join("")}
                </select>
              </div>
              <div class="quantity-selector">
                <label for="quantity-input">Cantidad:</label>
                <div class="quantity-input-group">
                  <button class="quantity-btn decrease">-</button>
                  <input type="number" min="1" value="1" id="quantity-input" class="quantity-input">
                  <button class="quantity-btn increase">+</button>
                </div>
              </div>
              <button id="add-to-cart-btn" class="add-to-cart-btn" data-product-id="${product.id}">
                <i class="fas fa-cart-plus"></i> Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
        
        <div class="product-detail-tabs">
          <div class="tabs-header">
            <button class="tab-btn active" data-tab="specifications">Especificaciones</button>
            <button class="tab-btn" data-tab="applications">Aplicaciones</button>
            <button class="tab-btn" data-tab="delivery">Entrega</button>
          </div>
          <div class="tabs-content">
            <div class="tab-content active" id="specifications">
              <ul>
                ${product.details.specifications.map((spec) => `<li>${spec}</li>`).join("")}
              </ul>
            </div>
            <div class="tab-content" id="applications">
              <ul>
                ${product.details.applications.map((app) => `<li>${app}</li>`).join("")}
              </ul>
            </div>
            <div class="tab-content" id="delivery">
              <p>${product.details.delivery}</p>
            </div>
          </div>
        </div>
      `

      // Add event listeners for tabs
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          // Remove active class from all tabs
          document.querySelectorAll(".tab-btn").forEach((el) => {
            el.classList.remove("active")
          })
          document.querySelectorAll(".tab-content").forEach((el) => {
            el.classList.remove("active")
          })

          // Add active class to clicked tab
          btn.classList.add("active")
          const tabId = btn.getAttribute("data-tab")
          document.getElementById(tabId).classList.add("active")
        })
      })

      // Add event listeners for quantity buttons
      const quantityInput = document.getElementById("quantity-input")

      document.querySelector(".quantity-btn.decrease").addEventListener("click", () => {
        if (Number.parseInt(quantityInput.value) > 1) {
          quantityInput.value = Number.parseInt(quantityInput.value) - 1
        }
      })

      document.querySelector(".quantity-btn.increase").addEventListener("click", () => {
        quantityInput.value = Number.parseInt(quantityInput.value) + 1
      })

      // Add event listener for add to cart button
      document.getElementById("add-to-cart-btn").addEventListener("click", () => {
        const quantity = Number.parseInt(document.getElementById("quantity-input").value)
        const unit = document.getElementById("unit-select").value

        addToCart(product, quantity, unit)
      })
    } catch (error) {
      console.error("Error loading product details:", error)
      productDetailContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error al cargar los detalles del producto. Intente nuevamente.</p>
          <a href="catalogo.html" class="boton-cta">
            <span>Volver al Catálogo</span>
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      `
    }
  }

  // Submit quote request
  const submitQuoteRequest = async () => {
    if (cart.length === 0) {
      showNotification("Agregue productos al carrito antes de solicitar una cotización", "error")
      return
    }

    // Check if user is logged in
    const token = localStorage.getItem("authToken")
    if (!token) {
      // Save current cart and redirect to login
      localStorage.setItem("pendingQuote", "true")
      window.location.href = "/login.html?redirect=cotizador/carrito.html"
      return
    }

    try {
      // Show loading state
      requestQuoteButton.disabled = true
      requestQuoteButton.innerHTML = `
        <span class="cargador-enviar"></span>
        <span class="texto-enviar">Procesando...</span>
      `

      // In a real application, this would send the request to the server
      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Clear cart after successful request
      cart = []
      saveCart()
      updateCartUI()

      // Show success message
      showNotification("Solicitud de cotización enviada correctamente", "success")

      // Reset button state
      requestQuoteButton.disabled = false
      requestQuoteButton.innerHTML = `
        <span class="texto-enviar">Solicitar Cotización</span>
        <span class="icono-enviar"><i class="fas fa-paper-plane"></i></span>
      `

      // Show success message in cart
      cartItemsContainer.innerHTML = `
        <div class="quote-success">
          <i class="fas fa-check-circle"></i>
          <h3>¡Solicitud Enviada!</h3>
          <p>Su solicitud de cotización ha sido enviada correctamente. Nos pondremos en contacto con usted a la brevedad.</p>
          <a href="catalogo.html" class="boton-cta">
            <span>Volver al Catálogo</span>
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      `
    } catch (error) {
      console.error("Error submitting quote request:", error)

      // Reset button state
      requestQuoteButton.disabled = false
      requestQuoteButton.innerHTML = `
        <span class="texto-enviar">Solicitar Cotización</span>
        <span class="icono-enviar"><i class="fas fa-paper-plane"></i></span>
      `

      // Show error message
      showNotification("Error al enviar la solicitud. Intente nuevamente.", "error")
    }
  }

  // Initialize
  const init = () => {
    // Load cart from localStorage
    loadCart()

    // Initialize search
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim()
        if (query.length >= 3 || query.length === 0) {
          searchProducts(query)
        }
      })
    }

    // Initialize filter buttons
    if (filterButtons) {
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          // Remove active class from all buttons
          filterButtons.forEach((el) => {
            el.classList.remove("active")
          })

          // Add active class to clicked button
          btn.classList.add("active")

          // Filter products
          const filter = btn.getAttribute("data-filter")
          filterProducts(filter)
        })
      })
    }

    // Initialize categories
    fetchCategories()

    // Initialize product details page
    loadProductDetails()

    // Initialize cart page
    if (cartItemsContainer) {
      renderCartItems()

      // Add event listener for clear cart button
      if (clearCartButton) {
        clearCartButton.addEventListener("click", () => {
          if (confirm("¿Está seguro de que desea vaciar el carrito?")) {
            cart = []
            saveCart()
            updateCartUI()
          }
        })
      }

      // Add event listener for request quote button
      if (requestQuoteButton) {
        requestQuoteButton.addEventListener("click", submitQuoteRequest)
      }
    }

    // Check for pending quote after login
    const pendingQuote = localStorage.getItem("pendingQuote")
    if (pendingQuote === "true" && window.location.pathname.includes("carrito.html")) {
      localStorage.removeItem("pendingQuote")
      showNotification("Ahora puede continuar con su solicitud de cotización", "success")
    }
  }

  // Run initialization
  init()
})

