# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := lwip_image
DEFS_Debug := \
	'-DNODE_GYP_MODULE_NAME=lwip_image' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION' \
	'-DDEBUG' \
	'-D_DEBUG'

# Flags passed to all source files.
CFLAGS_Debug := \
	-fPIC \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-pthread \
	-m64 \
	-g \
	-O0

# Flags passed to only C files.
CFLAGS_C_Debug :=

# Flags passed to only C++ files.
CFLAGS_CC_Debug := \
	-fno-rtti

INCS_Debug := \
	-I/home/vagrant/.node-gyp/0.10.25/include/node \
	-I/home/vagrant/.node-gyp/0.10.25/src \
	-I/home/vagrant/.node-gyp/0.10.25/deps/uv/include \
	-I/home/vagrant/.node-gyp/0.10.25/deps/v8/include \
	-I$(srcdir)/../nan \
	-I$(srcdir)/src/lib/cimg

DEFS_Release := \
	'-DNODE_GYP_MODULE_NAME=lwip_image' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION'

# Flags passed to all source files.
CFLAGS_Release := \
	-fPIC \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-pthread \
	-m64 \
	-O2 \
	-fno-strict-aliasing \
	-fno-tree-vrp \
	-fno-omit-frame-pointer

# Flags passed to only C files.
CFLAGS_C_Release :=

# Flags passed to only C++ files.
CFLAGS_CC_Release := \
	-fno-rtti

INCS_Release := \
	-I/home/vagrant/.node-gyp/0.10.25/include/node \
	-I/home/vagrant/.node-gyp/0.10.25/src \
	-I/home/vagrant/.node-gyp/0.10.25/deps/uv/include \
	-I/home/vagrant/.node-gyp/0.10.25/deps/v8/include \
	-I$(srcdir)/../nan \
	-I$(srcdir)/src/lib/cimg

OBJS := \
	$(obj).target/$(TARGET)/src/image/init.o \
	$(obj).target/$(TARGET)/src/image/image.o \
	$(obj).target/$(TARGET)/src/image/resize_worker.o \
	$(obj).target/$(TARGET)/src/image/rotate_worker.o \
	$(obj).target/$(TARGET)/src/image/blur_worker.o \
	$(obj).target/$(TARGET)/src/image/crop_worker.o \
	$(obj).target/$(TARGET)/src/image/mirror_worker.o \
	$(obj).target/$(TARGET)/src/image/pad_worker.o \
	$(obj).target/$(TARGET)/src/image/sharpen_worker.o \
	$(obj).target/$(TARGET)/src/image/hsla_worker.o \
	$(obj).target/$(TARGET)/src/image/opacify_worker.o \
	$(obj).target/$(TARGET)/src/image/paste_worker.o \
	$(obj).target/$(TARGET)/src/image/setpixel_worker.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# End of this set of suffix rules
### Rules for final target.
LDFLAGS_Debug := \
	-pthread \
	-rdynamic \
	-m64

LDFLAGS_Release := \
	-pthread \
	-rdynamic \
	-m64

LIBS :=

$(obj).target/lwip_image.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(obj).target/lwip_image.node: LIBS := $(LIBS)
$(obj).target/lwip_image.node: TOOLSET := $(TOOLSET)
$(obj).target/lwip_image.node: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,solink_module)

all_deps += $(obj).target/lwip_image.node
# Add target alias
.PHONY: lwip_image
lwip_image: $(builddir)/lwip_image.node

# Copy this to the executable output path.
$(builddir)/lwip_image.node: TOOLSET := $(TOOLSET)
$(builddir)/lwip_image.node: $(obj).target/lwip_image.node FORCE_DO_CMD
	$(call do_cmd,copy)

all_deps += $(builddir)/lwip_image.node
# Short alias for building this executable.
.PHONY: lwip_image.node
lwip_image.node: $(obj).target/lwip_image.node $(builddir)/lwip_image.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/lwip_image.node

