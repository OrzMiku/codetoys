/*
 * dynamic array
 * usage:
 * #define DA_IMPLEMENTATION
 * #include "da.h"
 * int *my_arr = NULL;
 * da_push(my_arr, 42);
 */

#ifndef DA_H_
#define DA_H_

#include <stddef.h>
#include <stdlib.h>

typedef struct {
  size_t count;
  size_t capacity;
} DaHeader;

void *_da_ensure_capacity(void *arr, size_t item_size);

// clang-format off
#define da_push(arr, item)                                  \
    do {                                                    \
        (arr) = _da_ensure_capacity((arr), sizeof(*(arr))); \
        (arr)[((DaHeader *)arr - 1)->count++] = (item);     \
    }while (0)

#define da_len(arr) \
    ((arr) == NULL ? 0 : ((DaHeader *)(arr) - 1) -> count)

#define da_free(arr)                            \
    do {                                        \
        if(arr) free((DaHeader *)(arr) - 1);    \
        (arr) = NULL;                           \
    }while (0)
// clang-format on

#ifdef DA_IMPLEMENTATION

#ifndef DA_DAFAULT_CAPACITY
#define DA_DAFAULT_CAPACITY 128
#endif // DA_DAFAULT_CAPACITY

void *_da_ensure_capacity(void *arr, size_t item_size) {
  // init
  if (arr == NULL) {
    DaHeader *header =
        (DaHeader *)malloc(sizeof(DaHeader) + DA_DAFAULT_CAPACITY * item_size);
    header->count = 0;
    header->capacity = DA_DAFAULT_CAPACITY;
    return (void *)(header + 1);
  }

  // resize
  DaHeader *header = (DaHeader *)arr - 1;
  if (header->count >= header->capacity) {
    size_t new_capacity = header->capacity * 2;
    header = (DaHeader *)realloc(header,
                                 sizeof(DaHeader) + new_capacity * item_size);
    header->capacity = new_capacity;
    return (void *)(header + 1);
  }

  // nothing
  return arr;
}
#endif // DA_IMPLEMENTATION

#endif // DA_H_
