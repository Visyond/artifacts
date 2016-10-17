# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := WebWorkerThreads
DEFS_Debug := \
	'-DNODE_GYP_MODULE_NAME=WebWorkerThreads' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION' \
	'-DDEBUG' \
	'-D_DEBUG'

# Flags passed to all source files.
CFLAGS_Debug := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-g \
	-O0

# Flags passed to only C files.
CFLAGS_C_Debug :=

# Flags passed to only C++ files.
CFLAGS_CC_Debug := \
	-fno-rtti \
	-std=gnu++0x

INCS_Debug := \
	-I/var/lib/jenkins/.node-gyp/4.4.4/include/node \
	-I/var/lib/jenkins/.node-gyp/4.4.4/src \
	-I/var/lib/jenkins/.node-gyp/4.4.4/deps/uv/include \
	-I/var/lib/jenkins/.node-gyp/4.4.4/deps/v8/include \
	-I$(srcdir)/../nan

DEFS_Release := \
	'-DNODE_GYP_MODULE_NAME=WebWorkerThreads' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION'

# Flags passed to all source files.
CFLAGS_Release := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-O3 \
	-ffunction-sections \
	-fdata-sections \
	-fno-omit-frame-pointer

# Flags passed to only C files.
CFLAGS_C_Release :=

# Flags passed to only C++ files.
CFLAGS_CC_Release := \
	-fno-rtti \
	-std=gnu++0x

INCS_Release := \
	-I/var/lib/jenkins/.node-gyp/4.4.4/include/node \
	-I/var/lib/jenkins/.node-gyp/4.4.4/src \
	-I/var/lib/jenkins/.node-gyp/4.4.4/deps/uv/include \
	-I/var/lib/jenkins/.node-gyp/4.4.4/deps/v8/include \
	-I$(srcdir)/../nan

OBJS := \
	$(obj).target/$(TARGET)/src/WebWorkerThreads.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.cc FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.cc FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.cc FORCE_DO_CMD
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

$(obj).target/WebWorkerThreads.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(obj).target/WebWorkerThreads.node: LIBS := $(LIBS)
$(obj).target/WebWorkerThreads.node: TOOLSET := $(TOOLSET)
$(obj).target/WebWorkerThreads.node: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,solink_module)

all_deps += $(obj).target/WebWorkerThreads.node
# Add target alias
.PHONY: WebWorkerThreads
WebWorkerThreads: $(builddir)/WebWorkerThreads.node

# Copy this to the executable output path.
$(builddir)/WebWorkerThreads.node: TOOLSET := $(TOOLSET)
$(builddir)/WebWorkerThreads.node: $(obj).target/WebWorkerThreads.node FORCE_DO_CMD
	$(call do_cmd,copy)

all_deps += $(builddir)/WebWorkerThreads.node
# Short alias for building this executable.
.PHONY: WebWorkerThreads.node
WebWorkerThreads.node: $(obj).target/WebWorkerThreads.node $(builddir)/WebWorkerThreads.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/WebWorkerThreads.node

