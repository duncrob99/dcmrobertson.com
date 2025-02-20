{ pkgs ? import <nixpkgs> {} }:

let
  /*
  lib = import <nixpkgs/lib>;
  buildNodeJs = pkgs.callPackage "${<nixpkgs>}/pkgs/development/web/nodejs/nodejs.nix" {
    python = pkgs.python3;
  };

  nodejsVersion = "22.12.0";

  nodejs = buildNodeJs {
    enableNpm = false;
    version = nodejsVersion;
    #sha256 = "1a0zj505nhpfcj19qvjy2hvc5a7gadykv51y0rc6032qhzzsgca2";
    sha256 = "sha256-/hvEvgBNwSch6iy2cbCKId4BxpdpYO+KEkh5hYlnnhY=";
  };
  */

  NPM_CONFIG_PREFIX = toString ./npm_config_prefix;

in pkgs.mkShell {
  packages = with pkgs.nodejs_22.pkgs; [
    nodejs
    npm
    webpack
    webpack-cli
    svelte-language-server
    typescript-language-server
  ];

  inherit NPM_CONFIG_PREFIX;

  shellHook = ''
    export PATH="${NPM_CONFIG_PREFIX}/bin:$PATH"
  '';
}
