with (import (fetchTarball https://github.com/NixOS/nixpkgs/archive/refs/tags/25.11.tar.gz) {});

stdenv.mkDerivation {
    name = "swu-checklist";

    shellHook = ''
        yarn install
        '';

    buildInputs = [
        yarn
        nodejs_22
        nodejs_22.pkgs.gulp
        nodejs_22.pkgs.yarn

        texliveFull

        unzip
        wget
    ];
}
