# multiple-website

host multiple websites under /public directory and static serve them dynamically using nodejs app

Data Flow Architecture
menu.json (Central)
├── dishes[] ──┐
├── ingredients[] ──┼── dishes.html (Management)
├── vendors[] ──┘ ├── ingredients.html (Management)
└── metadata ├── vendor.html (Management)
└── orders.html (Order Processing)
