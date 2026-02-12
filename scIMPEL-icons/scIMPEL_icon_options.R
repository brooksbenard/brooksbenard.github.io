# scIMPEL Icon Options
# Based on schematic: central box with radiating lines to circular nodes
# Color gradient: red → grey → blue (single-cell spectrum)
# Uses: https://pkg.mitchelloharawild.com/icons/

# Install if needed:
# remotes::install_github("mitchelloharawild/icons")
# icons::download_fontawesome()
# icons::download_feather_icons()
# icons::download_google_material()
# icons::download_bioicons()

library(icons)

# scIMPEL color scheme from schematic
scimpel_red <- "#c41e3a"
scimpel_grey <- "#6b7280"
scimpel_blue <- "#2563eb"

# Search for relevant icons
icon_find("circle")   # Circular elements like schematic nodes
icon_find("dot")      # Data points
icon_find("grid")     # Cell grid
icon_find("cells")    # Cell metaphor
icon_find("network")  # Connectivity
icon_find("share")    # Fanning/radiating
icon_find("activity") # Flow/spectrum
icon_find("layers")   # Layered data

# Option 1: Feather - activity (flow/spectrum lines)
# Option 2: Feather - circle (single cell)
# Option 3: Font Awesome - circle-dot (cell with nucleus)
# Option 4: Font Awesome - share-nodes (radiating connections)
# Option 5: Font Awesome - circles (multiple cells)
# Option 6: Google Material - hub (central connection)

# Generate icon options as SVG files
# Run from scIMPEL-icons/ or set working directory: setwd("path/to/scIMPEL-icons")
icons_dir <- "icons"
dir.create(icons_dir, showWarnings = FALSE, recursive = TRUE)

# Option 1: Activity/flow (spectrum lines)
tryCatch({
  act <- icon_style(feather_icons("activity"), scale = 2, fill = scimpel_blue)
  icon_save(act, file.path(icons_dir, "option1_activity.svg"))
}, error = function(e) message("Feather activity: ", e$message))

# Option 2: Circle (single cell)
tryCatch({
  circ <- icon_style(feather_icons("circle"), scale = 2, fill = scimpel_blue)
  icon_save(circ, file.path(icons_dir, "option2_circle.svg"))
}, error = function(e) message("Feather circle: ", e$message))

# Option 3: Grid (cell matrix)
tryCatch({
  grid <- icon_style(feather_icons("grid"), scale = 2, fill = scimpel_blue)
  icon_save(grid, file.path(icons_dir, "option3_grid.svg"))
}, error = function(e) message("Feather grid: ", e$message))

# Option 4: Layers (spectrum/states)
tryCatch({
  layers <- icon_style(feather_icons("layers"), scale = 2, fill = scimpel_blue)
  icon_save(layers, file.path(icons_dir, "option4_layers.svg"))
}, error = function(e) message("Feather layers: ", e$message))

# Option 5: Font Awesome - circle-dot (cell + nucleus)
tryCatch({
  dot <- icon_style(fontawesome("circle-dot", style = "solid"), scale = 2, fill = scimpel_blue)
  icon_save(dot, file.path(icons_dir, "option5_circle_dot.svg"))
}, error = function(e) message("FA circle-dot: ", e$message))

# Option 6: Font Awesome - share-nodes (radiating)
tryCatch({
  share <- icon_style(fontawesome("share-nodes", style = "solid"), scale = 2, fill = scimpel_blue)
  icon_save(share, file.path(icons_dir, "option6_share_nodes.svg"))
}, error = function(e) message("FA share-nodes: ", e$message))

# Option 7: Font Awesome - circles (multiple cells)
tryCatch({
  circles <- icon_style(fontawesome("circle", style = "solid"), scale = 2, fill = scimpel_blue)
  icon_save(circles, file.path(icons_dir, "option7_circle.svg"))
}, error = function(e) message("FA circle: ", e$message))

# Option 8: Bioicons - if available (biology-themed)
tryCatch({
  if (icon_installed("bioicons")) {
    # Try common bioicon names
    bio <- icon_find("cell", set = "bioicons")
    if (length(bio) > 0) {
      icon_save(icon_style(bio[[1]], scale = 2, fill = scimpel_blue),
                file.path(icons_dir, "option8_bioicons_cell.svg"))
    }
  }
}, error = function(e) message("Bioicons: ", e$message))

message("Icon options saved to ", normalizePath(icons_dir, mustWork = FALSE))
message("View in RStudio or open SVGs in browser.")
