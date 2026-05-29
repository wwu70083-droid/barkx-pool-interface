import barkXPoolArtifact from "./BarkXPool.json" with { type: "json" };
import barkXArtifact from "./BarkX.json" with { type: "json" };
import barkDaoArtifact from "./BarkDao.json" with { type: "json" };
import wVN1Artifact from "./wVN1.json" with { type: "json" };
import vnArtifact from "./vn.json" with { type: "json" };
import routerArtifact from "./UniswapV2Router02.json" with { type: "json" };
import factoryArtifact from "./UniswapV2Factory.json" with { type: "json" };
import pairArtifact from "./UniswapV2Pair.json" with { type: "json" };
import subPoolArtifact from "./BarkXSubPool.json" with { type: "json" };
import wVN2Artifact from "./wVN2.json" with { type: "json" };
import vLPArtifact from "./vLP.json" with { type: "json" };
import elitePoolArtifact from "./BarkXElitePool.json" with { type: "json" };
import vBarkxArtifact from "./vBARKX.json" with { type: "json" };

function extractAbi(artifact) {
  return Array.isArray(artifact) ? artifact : artifact.abi ?? [];
}

export const BarkXPoolAbi = extractAbi(barkXPoolArtifact);
export const BarkXAbi = extractAbi(barkXArtifact);
export const BarkDaoAbi = extractAbi(barkDaoArtifact);
export const WVN1Abi = extractAbi(wVN1Artifact);
export const VNAbi = extractAbi(vnArtifact);
export const UniswapV2Router02Abi = extractAbi(routerArtifact);
export const UniswapV2FactoryAbi = extractAbi(factoryArtifact);
export const UniswapV2PairAbi = extractAbi(pairArtifact);
export const BarkXSubPoolAbi = extractAbi(subPoolArtifact);
export const WVN2Abi = extractAbi(wVN2Artifact);
export const VLPAbi = extractAbi(vLPArtifact);
export const BarkXElitePoolAbi = extractAbi(elitePoolArtifact);
export const VBARKXAbi = extractAbi(vBarkxArtifact);
