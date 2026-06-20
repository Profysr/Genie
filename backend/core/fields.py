import os
import time
import uuid as _uuid_mod

from django.db import models


def generate_uuid7():
    """
    Generate a UUIDv7 (RFC 9562): 48-bit millisecond timestamp in the most-significant
    bits, version nibble 7, then 74 bits of randomness.

    Time-ordering means new rows always append to the end of the B-tree index rather
    than splitting random pages — critical for write throughput at scale.
    """
    ms = int(time.time() * 1000)
    rand = int.from_bytes(os.urandom(10), "big")  # 80 random bits

    i = (ms & 0xFFFFFFFFFFFF) << 80  # bits 0-47:  48-bit ms timestamp
    i |= 0x7 << 76  # bits 48-51: version = 7
    i |= ((rand >> 62) & 0xFFF) << 64  # bits 52-63: rand_a (12 bits)
    i |= 0x8000000000000000  # bits 64-65: variant = 10
    i |= rand & 0x3FFFFFFFFFFFFFFF  # bits 66-127: rand_b (62 bits)

    return _uuid_mod.UUID(int=i)


def format_id(prefix: str, value) -> str:
    """
    Serialize a UUID to a prefixed string for API responses and logs.
    Usage: format_id(Task.PREFIX, task.id)  →  "tsk_018e1a2b3c4d..."

    The prefix is API-layer only — the DB stores a native 16-byte UUID.
    """
    if isinstance(value, _uuid_mod.UUID):
        return f"{prefix}_{value.hex}"
    return f"{prefix}_{_uuid_mod.UUID(str(value)).hex}"


def parse_id(prefixed_id: str) -> _uuid_mod.UUID:
    """
    Parse a prefixed ID back to a UUID for DB lookups.
    Usage: parse_id("tsk_018e1a2b3c4d...")  →  UUID("018e1a2b-...")

    Raises ValueError if the string is not a valid prefixed ID.
    """
    if "_" not in prefixed_id:
        raise ValueError(f"Not a prefixed ID: {prefixed_id!r}")
    _, hex_part = prefixed_id.split("_", 1)
    try:
        return _uuid_mod.UUID(hex_part)
    except ValueError:
        raise ValueError(f"Invalid UUID in prefixed ID: {prefixed_id!r}")


try:
    from rest_framework import serializers as _drf

    class PrefixedUUIDField(_drf.Field):
        """
        DRF field for model PKs.  Output: "tsk_018e...".  Input: accepts both
        plain hex UUIDs and prefixed IDs — strips prefix before returning UUID.
        Add to any ModelSerializer: id = PrefixedUUIDField(read_only=True)
        """

        def to_representation(self, value):
            prefix = self.parent.Meta.model.PREFIX
            return format_id(prefix, value)

        def to_internal_value(self, data):
            try:
                if isinstance(data, str) and "_" in data:
                    return parse_id(data)
                return _uuid_mod.UUID(str(data))
            except (ValueError, AttributeError):
                raise _drf.ValidationError(f"Invalid ID: {data!r}")

except ImportError:
    pass


class UUIDv7Field(models.UUIDField):
    """
    Drop-in replacement for UUIDField(primary_key=True, default=uuid.uuid4).
    Generates time-sortable UUIDv7 values so ORDER BY id == ORDER BY created_at
    with zero extra cost.

    DB stores a native 16-byte UUID. Prefix lives on the model class (Model.PREFIX)
    and is applied at the API layer via format_id() / parse_id().
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("primary_key", True)
        kwargs.setdefault("default", generate_uuid7)
        kwargs.setdefault("editable", False)
        super().__init__(*args, **kwargs)
