import logging
import sys

from config import load_settings
from consumer import run_consumer


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )
    logging.getLogger("kafka").setLevel(logging.WARNING)
    settings = load_settings()
    run_consumer(settings)


if __name__ == "__main__":
    main()
