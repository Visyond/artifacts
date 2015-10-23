# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := lwip_decoder
DEFS_Debug := \
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
	-I/home/doctor/.node-gyp/0.10.40/src \
	-I/home/doctor/.node-gyp/0.10.40/deps/uv/include \
	-I/home/doctor/.node-gyp/0.10.40/deps/v8/include \
	-I$(srcdir)/node_modules/nan \
	-I$(srcdir)/src/decoder \
	-I$(srcdir)/src/lib/zlib \
	-I$(srcdir)/src/lib/jpeg \
	-I$(srcdir)/src/lib/cimg \
	-I$(srcdir)/src/lib/png \
	-I$(srcdir)/src/lib/gif

DEFS_Release := \
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
	-I/home/doctor/.node-gyp/0.10.40/src \
	-I/home/doctor/.node-gyp/0.10.40/deps/uv/include \
	-I/home/doctor/.node-gyp/0.10.40/deps/v8/include \
	-I$(srcdir)/node_modules/nan \
	-I$(srcdir)/src/decoder \
	-I$(srcdir)/src/lib/zlib \
	-I$(srcdir)/src/lib/jpeg \
	-I$(srcdir)/src/lib/cimg \
	-I$(srcdir)/src/lib/png \
	-I$(srcdir)/src/lib/gif

OBJS := \
	$(obj).target/$(TARGET)/src/decoder/init.o \
	$(obj).target/$(TARGET)/src/decoder/util.o \
	$(obj).target/$(TARGET)/src/decoder/buffer_worker.o \
	$(obj).target/$(TARGET)/src/decoder/jpeg_decoder.o \
	$(obj).target/$(TARGET)/src/decoder/png_decoder.o \
	$(obj).target/$(TARGET)/src/decoder/gif_decoder.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jmemnobs.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jcomapi.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdapimin.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdapistd.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdatadst.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdatasrc.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdcoefct.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdcolor.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jddctmgr.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdhuff.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdinput.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdmainct.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdmarker.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdmaster.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdpostct.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdsample.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jerror.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jfdctflt.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jfdctfst.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jfdctint.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jidctflt.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jidctfst.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jidctint.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jutils.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jmemmgr.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdarith.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jdmerge.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jaricom.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jquant1.o \
	$(obj).target/$(TARGET)/src/lib/jpeg/jquant2.o \
	$(obj).target/$(TARGET)/src/lib/png/png.o \
	$(obj).target/$(TARGET)/src/lib/png/pngset.o \
	$(obj).target/$(TARGET)/src/lib/png/pngget.o \
	$(obj).target/$(TARGET)/src/lib/png/pngrutil.o \
	$(obj).target/$(TARGET)/src/lib/png/pngtrans.o \
	$(obj).target/$(TARGET)/src/lib/png/pngread.o \
	$(obj).target/$(TARGET)/src/lib/png/pngrio.o \
	$(obj).target/$(TARGET)/src/lib/png/pngrtran.o \
	$(obj).target/$(TARGET)/src/lib/png/pngmem.o \
	$(obj).target/$(TARGET)/src/lib/png/pngerror.o \
	$(obj).target/$(TARGET)/src/lib/png/pngpread.o \
	$(obj).target/$(TARGET)/src/lib/zlib/adler32.o \
	$(obj).target/$(TARGET)/src/lib/zlib/crc32.o \
	$(obj).target/$(TARGET)/src/lib/zlib/gzlib.o \
	$(obj).target/$(TARGET)/src/lib/zlib/gzread.o \
	$(obj).target/$(TARGET)/src/lib/zlib/infback.o \
	$(obj).target/$(TARGET)/src/lib/zlib/inflate.o \
	$(obj).target/$(TARGET)/src/lib/zlib/inftrees.o \
	$(obj).target/$(TARGET)/src/lib/zlib/inffast.o \
	$(obj).target/$(TARGET)/src/lib/zlib/uncompr.o \
	$(obj).target/$(TARGET)/src/lib/zlib/zutil.o \
	$(obj).target/$(TARGET)/src/lib/zlib/trees.o \
	$(obj).target/$(TARGET)/src/lib/gif/dgif_lib.o \
	$(obj).target/$(TARGET)/src/lib/gif/gif_err.o \
	$(obj).target/$(TARGET)/src/lib/gif/gifalloc.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.c FORCE_DO_CMD
	@$(call do_cmd,cc,1)

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

$(obj).target/lwip_decoder.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(obj).target/lwip_decoder.node: LIBS := $(LIBS)
$(obj).target/lwip_decoder.node: TOOLSET := $(TOOLSET)
$(obj).target/lwip_decoder.node: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,solink_module)

all_deps += $(obj).target/lwip_decoder.node
# Add target alias
.PHONY: lwip_decoder
lwip_decoder: $(builddir)/lwip_decoder.node

# Copy this to the executable output path.
$(builddir)/lwip_decoder.node: TOOLSET := $(TOOLSET)
$(builddir)/lwip_decoder.node: $(obj).target/lwip_decoder.node FORCE_DO_CMD
	$(call do_cmd,copy)

all_deps += $(builddir)/lwip_decoder.node
# Short alias for building this executable.
.PHONY: lwip_decoder.node
lwip_decoder.node: $(obj).target/lwip_decoder.node $(builddir)/lwip_decoder.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/lwip_decoder.node

