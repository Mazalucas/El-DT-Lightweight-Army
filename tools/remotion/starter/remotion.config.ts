import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");
Config.overrideWebpackConfig(enableTailwind);
